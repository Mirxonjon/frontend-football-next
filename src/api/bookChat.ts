// Book AI Chat client — reuses the shared FT_API axios instance so the
// Bearer token, 401 → refresh → retry loop, and base URL are inherited.
// Do NOT create a fresh axios here; that would skip the refresh logic.

import FT_API from "./api";
import type {
  ApiEnvelope,
  BookChatHistory,
  BookChunksResponse,
  SendMessageResponse,
} from "../lib/types/book-chat";

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
};
