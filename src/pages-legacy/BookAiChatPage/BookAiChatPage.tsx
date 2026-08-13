"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import { Spin, message as antdMessage } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MessageOutlined,
  SendOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";

import { bookChatApi } from "../../api/bookChat";
import { fetchBookById } from "../../store/books/booksSlice";
import { useT } from "../../hook/useT";
import type {
  AiBookMessage,
  BookChunk,
  ChatLanguage,
  SourceCitation,
} from "../../lib/types/book-chat";
import s from "./BookAiChatPage.module.scss";

const MAX_LEN = 2000;

// Page size for the reader. 100 keeps the first paint snappy; the rest
// loads incrementally via the IntersectionObserver sentinel near the
// bottom of the list. Backend cap is 500 per call.
const CHUNKS_PAGE = 100;

type LangFilter = "all" | ChatLanguage;

// The PDF parser leaves literal `-- N of M --` markers between pages in
// the chunk text. We strip them here and render the page transitions
// separately as soft dividers so the reading flow doesn't show "garbage"
// inline markup. Falls through harmlessly if a chunk has none.
const PAGE_MARK_RE = /\s*--\s*(\d+)\s+of\s+(\d+)\s*--\s*/g;

type PageSegment =
  | { kind: "text"; value: string }
  | { kind: "page"; n: number; total: number };

const splitPageMarkers = (raw: string): PageSegment[] => {
  if (!raw) return [];
  const out: PageSegment[] = [];
  let last = 0;
  for (const m of raw.matchAll(PAGE_MARK_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", value: raw.slice(last, idx) });
    out.push({ kind: "page", n: Number(m[1]), total: Number(m[2]) });
    last = idx + m[0].length;
  }
  if (last < raw.length) out.push({ kind: "text", value: raw.slice(last) });
  return out;
};

// Defensive normaliser: trust the backend's new array shape but accept
// the legacy `number` (count) shape too so an in-flight backend deploy
// doesn't crash the UI mid-rollout. Drops anything that doesn't look
// like a real citation object.
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

const BookAiChatPage = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const t = useT();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const rawId = (params as any)?.id;
  const bookId = Number(rawId);

  const [bookTitle, setBookTitle] = useState("");
  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiBookMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);

  // NotebookLM-style left column: the full book content, paginated.
  // Chunks load 100 at a time — first page on mount, the rest as the
  // user scrolls the reader (independent from the chat scroll). A
  // citation click can request chunks beyond what's loaded; the
  // ensureChunkLoaded helper walks ahead until it gets there.
  const [chunks, setChunks] = useState<BookChunk[]>([]);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [chunksHasMore, setChunksHasMore] = useState<boolean>(false);
  const [chunksLoading, setChunksLoading] = useState<boolean>(false);
  const [chunksError, setChunksError] = useState<string>("");
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  const [highlightKey, setHighlightKey] = useState<number | null>(null);

  // Mobile (< 980 px) layout: NotebookLM-style tabs at the top swap
  // between the chat and the reader. Default tab is `chat`; tapping a
  // citation auto-switches to `sources` and scrolls to the chunk, same
  // way it works on desktop but with the panel taking the full screen
  // instead of sitting alongside the chat.
  const [mobileTab, setMobileTab] = useState<"chat" | "sources">("chat");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  const readerSentinelRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  // Guards against parallel page loads (mount, scroll, citation jump
  // can all fire at once).
  const chunksInFlightRef = useRef<boolean>(false);
  // Abort controller for the in-flight SSE stream. Lets a Stop button
  // cut a reply mid-flight without leaving the assistant bubble stuck.
  const streamAbortRef = useRef<AbortController | null>(null);

  // Abort any active stream when the user navigates away.
  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  // Initial load — fetch book metadata + chat history + first page of
  // reader chunks in parallel. The persisted history already carries
  // `sources` per assistant message (backend stores it in Postgres), so
  // citation chips work on scroll-back too.
  useEffect(() => {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      messageApi.error(t("Kitob topilmadi", "Книга не найдена", "Book not found"));
      navigate("/me/books");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [bookRes, history, firstChunks] = await Promise.all([
          dispatch(fetchBookById(bookId)).unwrap(),
          bookChatApi.getChat(bookId),
          // 403 here would mean the user doesn't own the book, but
          // that's already caught by getChat — so we tolerate this
          // failing softly (catch below) and let the chat still load.
          bookChatApi.getChunks(bookId, 0, CHUNKS_PAGE).catch(() => null),
        ]);
        if (cancelled) return;
        const title = (bookRes?.titleUz || bookRes?.titleRu || "").trim();
        setBookTitle(title);
        setBookFileUrl(bookRes?.fileUrl ?? null);
        setMessages(
          history.messages.map((m) => ({
            ...m,
            sources: normaliseSources((m as any).sources),
          }))
        );
        if (firstChunks) {
          setChunks(firstChunks.chunks);
          setTotalChunks(firstChunks.totalChunks);
          setChunksHasMore(firstChunks.hasMore);
        }
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 403) {
          messageApi.error(
            t(
              "Bu kitobga ruxsatingiz yoʻq",
              "У вас нет доступа к этой книге",
              "You don't have access to this book"
            )
          );
          window.setTimeout(() => router.back(), 600);
          return;
        }
        if (status === 404) {
          messageApi.error(
            t("Kitob topilmadi", "Книга не найдена", "Book not found")
          );
          window.setTimeout(() => router.back(), 600);
          return;
        }
        messageApi.error(
          t("Yuklashda xato", "Ошибка загрузки", "Loading error")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Auto-scroll on new messages or while typing indicator is up.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  // Auto-grow the textarea (max ~6 rows / 160px).
  const onInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic user bubble + an empty assistant placeholder that the
    // SSE stream will fill in. Splitting the temp ids by 1 keeps React
    // keys stable while the stream runs.
    const tempId = Date.now();
    const userMsg: AiBookMessage = {
      id: tempId,
      chatId: 0,
      role: "user",
      language: null,
      content: text,
      tokensIn: null,
      tokensOut: null,
      createdAt: new Date().toISOString(),
    };
    const aiTempId = tempId + 1;
    const aiPlaceholder: AiBookMessage = {
      id: aiTempId,
      chatId: 0,
      role: "assistant",
      language: null,
      content: "",
      tokensIn: null,
      tokensOut: null,
      createdAt: new Date().toISOString(),
      sources: [],
      streaming: true,
    };
    setMessages((m) => [...m, userMsg, aiPlaceholder]);
    setInput("");
    resetTextareaHeight();
    setSending(true);

    // Reuse a helper for the merge so token + sources updates don't have
    // to know about array layout.
    const patchAi = (patch: Partial<AiBookMessage>) =>
      setMessages((m) =>
        m.map((x) => (x.id === aiTempId ? { ...x, ...patch } : x))
      );
    const appendContent = (delta: string) =>
      setMessages((m) =>
        m.map((x) =>
          x.id === aiTempId ? { ...x, content: x.content + delta } : x
        )
      );

    const ctrl = new AbortController();
    streamAbortRef.current = ctrl;

    let errored: { code: string; message: string } | null = null;

    try {
      await bookChatApi.sendMessageStream(
        bookId,
        text,
        {
          onMeta: (meta) => {
            patchAi({ chatId: meta.chatId, language: meta.language });
          },
          onToken: (chunk) => {
            appendContent(chunk);
          },
          onSources: (sources) => {
            patchAi({ sources, tokensIn: sources.length });
          },
          onDone: (info) => {
            patchAi({
              streaming: false,
              tokensOut: info.tokensOut ?? null,
            });
            // Stream finished but nothing arrived — surface this as an
            // error so the bubble can roll back instead of dangling
            // empty. Common when the backend stream endpoint returns
            // 200 + no events (deploy mid-flight, model rate-limited).
            setMessages((m) => {
              const placeholder = m.find((x) => x.id === aiTempId);
              if (placeholder && !placeholder.content) {
                errored = {
                  code: "empty",
                  message:
                    t(
                      "AI javob bermadi. Qaytadan urinib koʻring.",
                      "AI не дал ответа. Попробуйте ещё раз.",
                      "AI gave no response. Try again."
                    ) || "Empty response",
                };
              }
              return m;
            });
          },
          onError: (err) => {
            errored = err;
          },
        },
        ctrl.signal
      );
    } finally {
      if (streamAbortRef.current === ctrl) {
        streamAbortRef.current = null;
      }
    }

    if (errored !== null) {
      const errCode = (errored as { code: string }).code;
      const errMessage = (errored as { message: string }).message;
      // Translate the well-known codes; fall through to a generic
      // toast for anything else.
      if (errCode === "forbidden") {
        messageApi.error(
          t(
            "Bu kitobga ruxsatingiz yoʻq",
            "У вас нет доступа к этой книге",
            "You don't have access to this book"
          )
        );
      } else if (errCode === "not_found") {
        messageApi.error(
          t("Topilmadi", "Не найдено", "Not found")
        );
      } else if (errCode === "upstream") {
        messageApi.error(
          t(
            "AI hozirda javob bera olmadi. Qaytadan urinib koʻring.",
            "AI сейчас не смог ответить. Попробуйте ещё раз.",
            "AI couldn't respond right now. Try again."
          )
        );
      } else {
        messageApi.error(
          errMessage ||
            t(
              "Xato. Qaytadan urinib koʻring.",
              "Ошибка. Попробуйте ещё раз.",
              "Error. Try again."
            )
        );
      }
      // If no tokens arrived at all, roll the bubble back so the chat
      // doesn't show an awkward empty assistant reply. If we got partial
      // content, keep it visible and flag the error inline.
      setMessages((m) => {
        const placeholder = m.find((x) => x.id === aiTempId);
        if (!placeholder || !placeholder.content) {
          // Hard rollback (user message AND placeholder) so the user
          // can re-send unchanged.
          setInput(text);
          return m.filter((x) => x.id !== tempId && x.id !== aiTempId);
        }
        return m.map((x) =>
          x.id === aiTempId
            ? { ...x, streaming: false, streamError: errMessage }
            : x
        );
      });
    }

    setSending(false);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // User-facing stop button: hard-abort the SSE stream and freeze the
  // partial reply in place. We don't roll back content the user has
  // already seen — feels more honest than wiping it.
  const onStop = () => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setMessages((m) =>
      m.map((x) =>
        x.streaming ? { ...x, streaming: false } : x
      )
    );
    setSending(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const onClear = async () => {
    if (clearing || messages.length === 0) return;
    const ok = window.confirm(
      t(
        "Suhbat tarixini tozalashni xohlaysizmi?",
        "Очистить историю чата?",
        "Clear chat history?"
      )
    );
    if (!ok) return;
    setClearing(true);
    try {
      await bookChatApi.clearChat(bookId);
      setMessages([]);
      setHighlightKey(null);
      messageApi.success(t("Tozalandi", "Очищено", "Cleared"));
    } catch {
      messageApi.error(
        t("Tozalashda xato", "Ошибка очистки", "Clear failed")
      );
    } finally {
      setClearing(false);
    }
  };

  // Load the next page of chunks from the backend. Guarded so a fast
  // scroll + citation jump can't fire two requests for the same range.
  const loadMoreChunks = useMemo(
    () => async (): Promise<BookChunk[] | null> => {
      if (chunksInFlightRef.current) return null;
      if (!chunksHasMore && chunks.length > 0) return null;
      chunksInFlightRef.current = true;
      setChunksLoading(true);
      setChunksError("");
      try {
        const offset = chunks.length;
        const res = await bookChatApi.getChunks(bookId, offset, CHUNKS_PAGE);
        // Merge by chunkIndex so an out-of-order response (citation jump
        // racing scroll) doesn't produce duplicates.
        setChunks((prev) => {
          const seen = new Set(prev.map((c) => c.chunkIndex));
          const merged = [...prev];
          for (const c of res.chunks) {
            if (!seen.has(c.chunkIndex)) merged.push(c);
          }
          merged.sort((a, b) => a.chunkIndex - b.chunkIndex);
          return merged;
        });
        setTotalChunks(res.totalChunks);
        setChunksHasMore(res.hasMore);
        return res.chunks;
      } catch (err: any) {
        setChunksError(
          err?.response?.data?.message ||
            err?.message ||
            t(
              "Kitobni yuklashda xato",
              "Ошибка загрузки книги",
              "Failed to load the book"
            )
        );
        return null;
      } finally {
        chunksInFlightRef.current = false;
        setChunksLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookId, chunks.length, chunksHasMore]
  );

  // Infinite scroll — observe a sentinel near the bottom of the reader
  // list. When it enters the viewport, fetch the next page. Independent
  // from the chat scroll because each column has its own overflow.
  useEffect(() => {
    const node = readerSentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && chunksHasMore && !chunksInFlightRef.current) {
            void loadMoreChunks();
            break;
          }
        }
      },
      { root: readerScrollRef.current, rootMargin: "400px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [chunksHasMore, loadMoreChunks]);

  // If a citation points to a chunk we haven't loaded yet, walk forward
  // by pages until we have it (or run out). Each page is one request —
  // for a citation deep in a 1000-chunk book we may fire 9-10 calls.
  // That's acceptable because (a) browser caches them per `private,
  // max-age=3600` and (b) it only happens on first click of a far-out
  // citation, not on every interaction.
  const ensureChunkLoaded = async (chunkIndex: number): Promise<void> => {
    let safety = 20; // hard cap so a buggy citation can't loop us
    while (safety-- > 0) {
      const loaded = chunks.find((c) => c.chunkIndex === chunkIndex);
      if (loaded) return;
      if (!chunksHasMore && chunks.length > 0) return;
      const fresh = await loadMoreChunks();
      if (!fresh || fresh.length === 0) return;
      if (fresh.some((c) => c.chunkIndex === chunkIndex)) return;
    }
  };

  // Single click handler for any citation interaction:
  //   - desktop → snap the reader's language filter to the citation's
  //               language (so the user reads the SAME-language book
  //               around the chunk, never a mixed UZ/RU stream),
  //               scroll to the chunk, then pulse it yellow
  //   - mobile  → pop the bottom sheet (reader is hidden on phones)
  //
  // The language snap is the key UX detail for bilingually embedded
  // books: ask in UZ → reader shows the UZ pass; ask in RU → reader
  // shows the RU pass; user always reads the source in one language.
  const onSourceClick = async (citation: SourceCitation) => {
    // Lock the reader to the citation's language. Books embedded in
    // two languages produce two parallel chunk streams; surfacing the
    // wrong one defeats the deep-link.
    setLangFilter(citation.language);
    // Mobile: bring the Sources tab to the front so the user sees the
    // book panel they just deep-linked into. The same scroll +
    // highlight code below works for both layouts.
    if (typeof window !== "undefined" && window.innerWidth < 980) {
      setMobileTab("sources");
    }
    await ensureChunkLoaded(citation.chunkIndex);
    setHighlightKey(citation.chunkIndex);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightKey(null);
      highlightTimerRef.current = null;
    }, 3200);
    // Defer the scroll two frames: one for the filter switch to commit
    // and reflow the list, one for the highlight class to land.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const node = document.querySelector(
          `[data-chunk-index="${citation.chunkIndex}"]`
        );
        node?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  // Are both languages present in the loaded chunks? Only render the
  // UZ/RU filter chips when it makes sense.
  const langCounts = useMemo(() => {
    let uz = 0;
    let ru = 0;
    for (const c of chunks) {
      if (c.language === "uz") uz++;
      else if (c.language === "ru") ru++;
    }
    return { uz, ru };
  }, [chunks]);

  const visibleChunks = useMemo(() => {
    if (langFilter === "all") return chunks;
    return chunks.filter((c) => c.language === langFilter);
  }, [chunks, langFilter]);

  const examples = [
    t(
      "Bu kitobning asosiy gʻoyasi nima?",
      "В чём главная идея этой книги?",
      "What is the main idea of this book?"
    ),
    t(
      "Boshlovchilar uchun qanday maslahatlar bor?",
      "Какие советы есть для начинающих?",
      "What tips are there for beginners?"
    ),
    t(
      "Eng muhim taktikalar qaysilari?",
      "Какие самые важные тактики?",
      "Which tactics are most important?"
    ),
  ];

  const splitOn = chunks.length > 0 || chunksLoading;
  const showLangFilter = langCounts.uz > 0 && langCounts.ru > 0;

  // CSS class that controls which mobile tab is "in front". When the
  // shell is in split mode and we're below 980 px, only one column is
  // visible at a time; on desktop both classes are no-ops because the
  // grid lays them out side-by-side.
  const mobileTabClass = splitOn
    ? mobileTab === "chat"
      ? s.mobileTabChat
      : s.mobileTabSources
    : "";

  return (
    <div
      className={`${s.shell} ${splitOn ? s.shellSplit : ""} ${mobileTabClass}`}
    >
      {contextHolder}

      {/* ─── Mobile tab bar (hidden ≥ 980 px) ────────────────── */}
      {splitOn && (
        <nav className={s.mobileTabs} role="tablist" aria-label="panel switcher">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "sources"}
            className={`${s.mobileTab} ${
              mobileTab === "sources" ? s.mobileTabActive : ""
            }`}
            onClick={() => setMobileTab("sources")}
          >
            <BookOutlined />
            {t("Manbalar", "Источники", "Sources")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "chat"}
            className={`${s.mobileTab} ${
              mobileTab === "chat" ? s.mobileTabActive : ""
            }`}
            onClick={() => setMobileTab("chat")}
          >
            <MessageOutlined />
            {t("Suhbat", "Чат", "Chat")}
          </button>
        </nav>
      )}

      {/* ─── Reader column (LEFT on desktop, tab=sources on mobile) ─── */}
      {splitOn && (
        <aside className={s.readerCol} aria-label="book reader">
          <div className={s.readerHeader}>
            <button
              type="button"
              className={s.headerBtn}
              onClick={() => router.back()}
              aria-label={t("Orqaga", "Назад", "Back")}
            >
              <ArrowLeftOutlined />
            </button>
            <div className={s.viewerTitle}>
              <BookOutlined />
              <span>
                {t(
                  `Kitob · ${chunks.length}/${totalChunks || chunks.length}`,
                  `Книга · ${chunks.length}/${totalChunks || chunks.length}`,
                  `Book · ${chunks.length}/${totalChunks || chunks.length}`
                )}
              </span>
            </div>
            {showLangFilter && (
              <div className={s.langFilter} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={langFilter === "all"}
                  className={`${s.langChip} ${langFilter === "all" ? s.langChipActive : ""}`}
                  onClick={() => setLangFilter("all")}
                >
                  {t("Hammasi", "Все", "All")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={langFilter === "uz"}
                  className={`${s.langChip} ${langFilter === "uz" ? s.langChipActive : ""}`}
                  onClick={() => setLangFilter("uz")}
                >
                  UZ <span className={s.langCount}>{langCounts.uz}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={langFilter === "ru"}
                  className={`${s.langChip} ${langFilter === "ru" ? s.langChipActive : ""}`}
                  onClick={() => setLangFilter("ru")}
                >
                  RU <span className={s.langCount}>{langCounts.ru}</span>
                </button>
              </div>
            )}
            {bookFileUrl && (
              <a
                href={bookFileUrl}
                target="_blank"
                rel="noreferrer"
                className={s.headerBtn}
                title={t(
                  "Toʻliq kitobni ochish",
                  "Открыть всю книгу",
                  "Open full book"
                )}
                aria-label={t(
                  "Toʻliq kitobni ochish",
                  "Открыть всю книгу",
                  "Open full book"
                )}
              >
                <FileTextOutlined />
              </a>
            )}
          </div>
          <div ref={readerScrollRef} className={s.readerScroll}>
            <div className={s.readerInner}>
              <h2 className={s.readerBookTitle}>
                {bookTitle || t("Kitob", "Книга", "Book")}
              </h2>
              <p className={s.readerHint}>
                {t(
                  "Suhbatda [N] ni bossangiz, tegishli parcha bu yerda sariq belgi bilan ajratiladi.",
                  "Нажмите [N] в чате — здесь жёлтым подсветится фрагмент.",
                  "Tap [N] in the chat to jump here with a yellow highlight."
                )}
              </p>

              {chunks.length === 0 && chunksLoading && (
                <div className={s.readerInitial}>
                  <Spin />
                </div>
              )}

              {/* Render every chunk as ONE flowing book — no cards, no
                  per-chunk header. The only seams we expose are:
                  - language transitions (UZ ↔ RU) as a faint margin
                    badge
                  - page breaks (`-- 4 of 620 --` markers inside chunk
                    text) extracted out and rendered as a centred page
                    divider, so the reader knows where it is in the
                    original book without garbage inline text
                  - the currently highlighted chunk gets a yellow swipe */}
              <article className={s.flow}>
                {visibleChunks.map((c, i) => {
                  const prev = i > 0 ? visibleChunks[i - 1] : null;
                  const langBreak = !prev || prev.language !== c.language;
                  const isActive = highlightKey === c.chunkIndex;
                  const segments = splitPageMarkers(c.text);
                  return (
                    <span
                      key={c.chunkIndex}
                      data-chunk-index={c.chunkIndex}
                      className={`${s.flowChunk} ${
                        isActive ? s.flowChunkActive : ""
                      }`}
                    >
                      {langBreak && (
                        <span className={s.flowLangMark} aria-hidden="true">
                          {c.language.toUpperCase()}
                        </span>
                      )}
                      {segments.map((seg, j) =>
                        seg.kind === "page" ? (
                          <span
                            key={`p-${j}`}
                            className={s.pageMark}
                            aria-label={t(
                              `${seg.n}-bet`,
                              `Стр. ${seg.n}`,
                              `Page ${seg.n}`
                            )}
                          >
                            <span className={s.pageMarkLabel}>
                              {t(
                                `${seg.n}-bet`,
                                `Стр. ${seg.n}`,
                                `Page ${seg.n}`
                              )}
                            </span>
                          </span>
                        ) : (
                          <span key={`t-${j}`}>{seg.value}</span>
                        )
                      )}
                      {i < visibleChunks.length - 1 && " "}
                    </span>
                  );
                })}
              </article>

              {/* IntersectionObserver sentinel — triggers next page when
                  visible. Stays mounted while hasMore so the obs hook
                  always has a target. */}
              {chunksHasMore && (
                <div ref={readerSentinelRef} className={s.readerSentinel}>
                  {chunksLoading && <Spin size="small" />}
                </div>
              )}

              {!chunksHasMore && chunks.length > 0 && (
                <p className={s.readerEnd}>
                  {t("Tugadi", "Конец", "End")}
                </p>
              )}

              {chunksError && (
                <div className={s.readerErr}>
                  <span>{chunksError}</span>
                  <button
                    type="button"
                    className={s.headerBtn}
                    onClick={() => void loadMoreChunks()}
                  >
                    {t("Qayta urinish", "Повторить", "Retry")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ─── Chat column (RIGHT) ─────────────────────────────── */}
      <section className={s.chatCol}>
        <header className={s.header}>
          <button
            type="button"
            className={s.headerBtn}
            onClick={() => router.back()}
            aria-label={t("Orqaga", "Назад", "Back")}
          >
            <ArrowLeftOutlined />
          </button>
          <div className={s.headerTitle} title={bookTitle}>
            <span className={s.headerLabel}>
              {t("AI murabbiy", "AI тренер", "AI coach")}
            </span>
            <span className={s.headerSep} aria-hidden="true">
              ·
            </span>
            <span className={s.headerBook}>
              {bookTitle || t("Kitob", "Книга", "Book")}
            </span>
          </div>
          <div className={s.headerActions}>
            {messages.length > 0 ? (
              <button
                type="button"
                className={s.headerBtn}
                onClick={onClear}
                disabled={clearing}
                aria-label={t("Tozalash", "Очистить", "Clear")}
              >
                <DeleteOutlined />
              </button>
            ) : (
              <span className={s.headerBtnPlaceholder} aria-hidden="true" />
            )}
          </div>
        </header>

        {loading ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : (
          <div ref={scrollRef} className={s.thread}>
            {messages.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>
                  <ThunderboltFilled />
                </div>
                <h2 className={s.emptyTitle}>
                  {t(
                    "Kitob haqida savol bering",
                    "Задайте вопрос о книге",
                    "Ask a question about the book"
                  )}
                </h2>
                <p className={s.emptySub}>
                  {t(
                    "AI faqat shu kitob matnidan javob beradi. Manbalarni koʻrish uchun [1] kabi raqamlarni bosing.",
                    "AI отвечает только по тексту этой книги. Нажмите [1], чтобы увидеть источник.",
                    "The AI answers only from this book. Tap [1] to see the source."
                  )}
                </p>
                <div className={s.examples}>
                  {examples.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={s.exampleBtn}
                      onClick={() => {
                        setInput(q);
                        window.setTimeout(
                          () => textareaRef.current?.focus(),
                          0
                        );
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className={s.list}>
                {messages.map((m) => {
                  const isAi = m.role === "assistant";
                  const sources: SourceCitation[] = isAi
                    ? m.sources ?? []
                    : [];
                  if (isAi) {
                    // Turn `[N]` markers into markdown links of the form
                    // `[[N]](#cite-N)`. The `components.a` override below
                    // looks them up by `.n` (NOT by array index — the
                    // backend numbers them 1.. in document order and may
                    // skip values if it dedupes).
                    const linked = sources.length
                      ? m.content.replace(
                          /\[(\d+)\]/g,
                          (whole, n) =>
                            sources.find((src) => src.n === Number(n))
                              ? `[[${n}]](#cite-${n})`
                              : whole
                        )
                      : m.content;
                    const isStreaming = !!m.streaming;
                    // Belt-and-braces: show the typing dots whenever the
                    // assistant bubble is empty AND a request is in
                    // flight. This catches edge cases where the stream
                    // hits `done` without ever emitting a token (e.g.
                    // backend issue, no chunks matched) and our flag
                    // would otherwise leave a blank bubble.
                    const isEmptyStreaming =
                      !m.content && (isStreaming || sending);
                    return (
                      <li key={m.id} className={`${s.row} ${s.rowAi}`}>
                        <div className={s.aiHead}>
                          <span className={s.aiAvatar} aria-hidden="true">
                            <ThunderboltFilled />
                          </span>
                          <span className={s.aiLabel}>
                            {t("AI murabbiy", "AI тренер", "AI coach")}
                          </span>
                        </div>
                        <div
                          className={`${s.aiBlock} ${
                            isEmptyStreaming ? s.typingBlock : ""
                          }`}
                        >
                          {isEmptyStreaming ? (
                            <>
                              <span className={s.typingDots}>
                                <span />
                                <span />
                                <span />
                              </span>
                              <span className={s.typingLabel}>
                                {t(
                                  "AI oʻylayapti...",
                                  "AI думает...",
                                  "AI is thinking..."
                                )}
                              </span>
                            </>
                          ) : (
                            <div className={s.markdown}>
                              <ReactMarkdown
                                components={{
                                  a: ({ href, children }) => {
                                    const mm = /^#cite-(\d+)$/.exec(
                                      href || ""
                                    );
                                    if (mm) {
                                      const n = Number(mm[1]);
                                      const src = sources.find(
                                        (sx) => sx.n === n
                                      );
                                      if (!src) return <>{children}</>;
                                      return (
                                        <button
                                          type="button"
                                          className={s.cite}
                                          title={src.preview.slice(0, 220)}
                                          onClick={() => onSourceClick(src)}
                                        >
                                          {children}
                                        </button>
                                      );
                                    }
                                    return (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {children}
                                      </a>
                                    );
                                  },
                                }}
                              >
                                {linked}
                              </ReactMarkdown>
                              {isStreaming && (
                                <span
                                  className={s.typingCursor}
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          )}
                          {m.streamError && !isStreaming && (
                            <div className={s.streamError}>
                              {t(
                                "Javob toʻliq kelmadi — qaytadan urinib koʻring.",
                                "Ответ оборвался — попробуйте ещё раз.",
                                "Reply was cut short — try again."
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={m.id} className={`${s.row} ${s.rowMe}`}>
                      <div className={`${s.bubble} ${s.bubbleMe}`}>
                        <p className={s.userText}>{m.content}</p>
                      </div>
                    </li>
                  );
                })}
                {/* No standalone "AI is thinking" bubble here — the
                    streaming placeholder above renders the same indicator
                    inside the assistant bubble itself, then transitions
                    into actual content as tokens arrive. */}
                <div ref={bottomRef} />
              </ul>
            )}
          </div>
        )}

        <div className={s.composerBand}>
          <form
            className={s.composer}
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
          >
            <textarea
              ref={textareaRef}
              className={s.textarea}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder={t(
                "Kitob haqida savol bering...",
                "Задайте вопрос о книге...",
                "Ask about the book..."
              )}
              maxLength={MAX_LEN}
              disabled={sending}
              rows={1}
              aria-label={t("Xabar", "Сообщение", "Message")}
            />
            {sending ? (
              <button
                type="button"
                className={`${s.sendBtn} ${s.stopBtn}`}
                onClick={onStop}
                aria-label={t("To'xtatish", "Остановить", "Stop")}
                title={t("To'xtatish", "Остановить", "Stop")}
              >
                <span className={s.stopSquare} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                className={s.sendBtn}
                disabled={!input.trim()}
                aria-label={t("Yuborish", "Отправить", "Send")}
              >
                <SendOutlined />
              </button>
            )}
          </form>
        </div>
      </section>

    </div>
  );
};

export default BookAiChatPage;
