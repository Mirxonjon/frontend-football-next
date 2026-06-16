// Shapes for the "Book AI Chat" feature. The backend wraps every response
// in `{ status_code, data }` via a global interceptor — unwrap with `.data`.

export type ChatLanguage = "uz" | "ru";
export type ChatRole = "user" | "assistant";

/** One book chunk the model leaned on. `n` is the citation marker that
 *  appears as `[n]` inside `answer` — keep it as the source of truth for
 *  matching, never assume `sources[i].n === i + 1`. Backend doesn't yet
 *  return a `pageNumber`; the reader is shown the chunkIndex + preview. */
export interface SourceCitation {
  n: number;            // matches [n] inside answer text (1-indexed)
  chunkIndex: number;   // 0-based sequential chunk position in the book
  language: ChatLanguage;
  preview: string;      // ~240-char snippet for the side panel
}

export interface AiBookMessage {
  id: number;
  chatId: number;
  role: ChatRole;
  language: ChatLanguage | null;
  content: string;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string; // ISO
  /** Present on assistant messages (live + persisted history). null/[]
   *  on user messages or when the model found nothing in the book. */
  sources?: SourceCitation[] | null;
}

export interface AiBookChat {
  id: number;
  userId: number;
  bookId: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookChatHistory {
  chat: AiBookChat;
  messages: AiBookMessage[];
}

export interface SendMessageResponse {
  /** AI reply in the question's language. Contains `[1] [2]` markers
   *  whose numbers match `sources[i].n`. */
  answer: string;
  language: ChatLanguage;
  /** Array of cited book chunks. Always an array — empty `[]` means the
   *  model couldn't find anything relevant in the book; `answer` will
   *  say so politely. Still a normal assistant message. */
  sources: SourceCitation[];
  chatId: number;
}

/** Single chunk from the book reader endpoint. Full text (not preview)
 *  — this is the master content the NotebookLM-style left column renders
 *  and that citations deep-link into. */
export interface BookChunk {
  chunkIndex: number;
  language: ChatLanguage;
  text: string;
  /** Optional — backend doesn't have it yet but the type is forward-
   *  compatible for when PDF page numbers get embedded. */
  pageNumber?: number;
}

export interface BookChunksResponse {
  bookId: number;
  totalChunks: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  chunks: BookChunk[];
}

export interface ApiEnvelope<T> {
  status_code: number;
  data: T;
}
