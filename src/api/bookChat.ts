// Book AI Chat client — reuses the shared FT_API axios instance so the
// Bearer token, 401 → refresh → retry loop, and base URL are inherited.
// Do NOT create a fresh axios here; that would skip the refresh logic.

import FT_API from "./api";
import { tokens } from "./tokens";
import type {
  ApiEnvelope,
  BookChatHistory,
  BookChunksResponse,
  ChatLanguage,
  SendMessageResponse,
  SourceCitation,
} from "../lib/types/book-chat";

// Streaming endpoint lives outside the axios instance because browser
// fetch is what gives us a ReadableStream — axios buffers the whole
// body. We rebuild the base URL the same way api.ts does so the two
// stay in sync.
const STREAM_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4021/v1/";
const STREAM_STRIPPED_BASE = STREAM_BASE_URL.replace(/\/+$/, "");

export type StreamCallbacks = {
  onMeta?: (meta: { chatId: number; language: ChatLanguage }) => void;
  onToken?: (text: string) => void;
  onSources?: (sources: SourceCitation[]) => void;
  onDone?: (info: {
    messageId: number;
    tokensIn?: number;
    tokensOut?: number;
    finishReason?: string;
  }) => void;
  onError?: (err: { code: string; message: string }) => void;
};

// Sniff out only well-formed citation objects from a server payload so
// a backend hiccup can't crash the renderer downstream.
const normaliseSources = (raw: unknown): SourceCitation[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is SourceCitation =>
      !!x &&
      typeof x === "object" &&
      typeof (x as any).n === "number" &&
      typeof (x as any).preview === "string"
  );
};

export const bookChatApi = {
  /** GET /me/books/:bookId/ai-chat — fetch (or auto-create) the chat
   *  + all messages oldest first. */
  getChat: async (bookId: number): Promise<BookChatHistory> => {
    const { data } = await FT_API.get<ApiEnvelope<BookChatHistory>>(
      `/me/books/${bookId}/ai-chat`
    );
    return data.data;
  },

  /** POST /me/books/:bookId/ai-chat/messages — 2-5 s latency call.
   *  Bumped per-request timeout to 30 s; the default axios timeout in
   *  the shared instance is small and would abort this. */
  sendMessage: async (
    bookId: number,
    message: string
  ): Promise<SendMessageResponse> => {
    const { data } = await FT_API.post<ApiEnvelope<SendMessageResponse>>(
      `/me/books/${bookId}/ai-chat/messages`,
      { message },
      { timeout: 30000 }
    );
    return data.data;
  },

  /** DELETE /me/books/:bookId/ai-chat — wipes the chat history. */
  clearChat: async (bookId: number): Promise<{ deleted: number }> => {
    const { data } = await FT_API.delete<ApiEnvelope<{ deleted: number }>>(
      `/me/books/${bookId}/ai-chat`
    );
    return data.data;
  },

  /** GET /me/books/:bookId/chunks — paginated book reader content.
   *  Backend caps limit at 500. Browser-cached for 1h (private). */
  getChunks: async (
    bookId: number,
    offset = 0,
    limit = 100
  ): Promise<BookChunksResponse> => {
    const { data } = await FT_API.get<ApiEnvelope<BookChunksResponse>>(
      `/me/books/${bookId}/chunks`,
      { params: { offset, limit } }
    );
    return data.data;
  },

  /** POST /me/books/:bookId/ai-chat/messages/stream — Server-Sent
   *  Events stream. Each `event: token` callback fires with the next
   *  chunk of model output (often a few characters), so the UI can grow
   *  the assistant message in place.
   *
   *  Uses raw fetch (not axios) because axios buffers the whole body
   *  before exposing it. Token refresh on 401 mid-stream is NOT handled
   *  here — by this point the page has already exercised axios for
   *  metadata/history calls, so the token is fresh; if it expires mid-
   *  stream the caller surfaces an `error` event and the user retries.
   *
   *  Returns a Promise that resolves when `done` (or `error`) fires.
   *  The caller passes an AbortSignal to support a stop button. */
  sendMessageStream: async (
    bookId: number,
    message: string,
    cb: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    const token = tokens.access;
    let res: Response;
    try {
      res = await fetch(
        `${STREAM_STRIPPED_BASE}/me/books/${bookId}/ai-chat/messages/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message }),
          signal,
        }
      );
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      cb.onError?.({
        code: "network",
        message: err?.message || "Network error",
      });
      return;
    }

    if (!res.ok || !res.body) {
      // Try to read a JSON error envelope; fall through with the status
      // code if the body isn't parseable.
      let detail = "";
      try {
        const txt = await res.text();
        try {
          const parsed = JSON.parse(txt);
          detail = parsed?.message || parsed?.error?.message || "";
        } catch {
          detail = txt;
        }
      } catch {
        /* noop */
      }
      cb.onError?.({
        code:
          res.status === 401
            ? "unauthorized"
            : res.status === 403
              ? "forbidden"
              : res.status === 404
                ? "not_found"
                : `http_${res.status}`,
        message: detail || `HTTP ${res.status}`,
      });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frame separator = "\n\n"
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          if (!frame.trim()) continue;

          const lines = frame.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLines = lines.filter((l) => l.startsWith("data:"));
          if (!eventLine || dataLines.length === 0) continue;

          const eventName = eventLine.slice(6).trim();
          // Multi-line `data:` fields concatenate per the SSE spec.
          const dataStr = dataLines
            .map((l) => l.slice(5).replace(/^ /, ""))
            .join("\n");

          let payload: any;
          try {
            payload = JSON.parse(dataStr);
          } catch {
            continue;
          }

          switch (eventName) {
            case "meta":
              cb.onMeta?.(payload);
              break;
            case "token":
              if (typeof payload?.text === "string") {
                cb.onToken?.(payload.text);
              }
              break;
            case "sources":
              cb.onSources?.(normaliseSources(payload));
              break;
            case "done":
              cb.onDone?.(payload);
              return;
            case "error":
              cb.onError?.({
                code: payload?.code || "unknown",
                message: payload?.message || "Stream error",
              });
              return;
            default:
              /* unknown event — ignore */
              break;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      cb.onError?.({
        code: "stream",
        message: err?.message || "Stream interrupted",
      });
    }
  },
};
