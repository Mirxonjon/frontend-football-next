"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import LessonBlockRenderer from "../LessonBlockRenderer/LessonBlockRenderer";
import PaywallOverlay from "../PaywallOverlay/PaywallOverlay";
import type { Lesson, LessonBlock } from "../../../store/lessons/lessonsSlice";
import {
  fetchLessonProgress,
  updateLessonProgress,
  type LessonProgress,
} from "../../../store/lessonProgress/lessonProgressSlice";
import s from "./BlocksList.module.scss";

type Props = {
  lesson: Lesson | null;
  loading?: boolean;
  lang: "uz" | "ru" | string;
  onUrlExpired?: () => void;
};

const formatDuration = (sec: number | null | undefined) => {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const blockLabel = (type: string, lang: string) => {
  const map: Record<string, { uz: string; ru: string; en: string }> = {
    TITLE: { uz: "Sarlavha", ru: "Заголовок", en: "Title" },
    TEXT: { uz: "Matn", ru: "Текст", en: "Text" },
    VIDEO: { uz: "Video", ru: "Видео", en: "Video" },
    IMAGE: { uz: "Rasm", ru: "Изображение", en: "Image" },
    FILE: { uz: "Material", ru: "Материал", en: "Material" },
    HINT: { uz: "Maslahat", ru: "Подсказка", en: "Hint" },
  };
  const entry = map[type];
  if (!entry) return type;
  if (lang === "ru") return entry.ru;
  if (lang === "en") return entry.en;
  return entry.uz;
};

const BlocksList = ({ lesson, loading, lang, onUrlExpired }: Props) => {
  const dispatch = useDispatch<any>();
  const [messageApi, msgCtx] = message.useMessage();

  // We only fire the progress PATCH the first time a block crosses 90%
  // (the `completedSeqs.has(...)` guard below). That already prevents
  // network spam, so no need for a debounce — and a debounce is what
  // caused progress to be lost when users reloaded within 10 seconds.
  const lastSentRef = useRef<{ lessonId: number; seq: number } | null>(null);
  // Show the "subscription required" toast at most once per session.
  const noSubToastShownRef = useRef(false);

  // Server-side saved progress for this lesson (resume + ✓ marks).
  const savedProgress = useSelector(
    (state: any) =>
      lesson
        ? ((state.lessonProgress?.byLesson?.[lesson.id] ?? null) as
            | LessonProgress
            | null)
        : null
  );

  // Locally-tracked "watched" set (✓ marks). Seeded from server progress
  // so reloads don't lose the green checkmarks.
  const [completedSeqs, setCompletedSeqs] = useState<Set<number>>(new Set());

  // On lesson change: clear local state, hydrate ✓ marks from saved progress,
  // and ask the server for the latest snapshot.
  useEffect(() => {
    if (!lesson?.id) {
      setCompletedSeqs(new Set());
      lastSentRef.current = null;
      return;
    }
    lastSentRef.current = null;
    // Refetch — quietly fails for anonymous / no-subscription users.
    dispatch(fetchLessonProgress(lesson.id));
  }, [dispatch, lesson?.id]);

  // NOTE: We do NOT seed `completedSeqs` from the server's
  // `lastBlockSequence` here, because block sequenceOrder values aren't
  // guaranteed to start at 1 or be consecutive (the backend can have
  // gaps). Instead, the render below treats a block as "completed" when
  // EITHER the user finished it locally in this session, OR the server
  // says lastBlockSequence ≥ this block's sequenceOrder. That removes
  // any sequencing assumption.


  const sendProgress = (lessonId: number, lastBlockSequence: number) => {
    // Skip if we just sent the same value for the same lesson — avoids
    // duplicate PATCHes when 90% and onEnded both fire close together.
    const last = lastSentRef.current;
    if (
      last &&
      last.lessonId === lessonId &&
      last.seq >= lastBlockSequence
    ) {
      return;
    }
    lastSentRef.current = { lessonId, seq: lastBlockSequence };
    // Fire immediately so a quick reload / navigation doesn't lose progress.
    void dispatch(updateLessonProgress({ lessonId, lastBlockSequence }))
      .unwrap()
      .catch((err: any) => {
        // Show a friendly message when the backend rejects the save —
        // most often 403 (subscription required). Without this, users
        // silently lost progress without knowing why.
        const status = err?.status;
        if (status === 403 && !noSubToastShownRef.current) {
          noSubToastShownRef.current = true;
          messageApi.warning(
            lang === "ru"
              ? "Прогресс не сохранён — нужна активная подписка"
              : lang === "en"
                ? "Progress not saved — active subscription required"
                : "Jarayon saqlanmadi — faol obuna kerak"
          );
        } else if (status && status !== 401) {
          // 401 is handled by the global refresh interceptor; ignore.
          messageApi.error(
            (err?.message as string) ||
              (lang === "ru"
                ? "Не удалось сохранить прогресс"
                : lang === "en"
                  ? "Couldn't save progress"
                  : "Jarayon saqlab bo'lmadi")
          );
        }
        // Roll back the local checkmark so the UI matches the server —
        // otherwise the user sees a green "Tugatildi" that vanishes on reload.
        setCompletedSeqs((prev) => {
          if (!prev.has(lastBlockSequence)) return prev;
          const next = new Set(prev);
          next.delete(lastBlockSequence);
          return next;
        });
        // Allow a future retry for the same block (clear the dedupe guard).
        if (
          lastSentRef.current &&
          lastSentRef.current.lessonId === lessonId &&
          lastSentRef.current.seq === lastBlockSequence
        ) {
          lastSentRef.current = null;
        }
      });
  };

  const onVideoProgress = (block: LessonBlock) =>
    (cur: number, total: number) => {
      if (!lesson) return;
      if (!total || total <= 0) return;
      if (cur / total >= 0.9 && !completedSeqs.has(block.sequenceOrder)) {
        setCompletedSeqs((prev) => {
          const next = new Set(prev);
          next.add(block.sequenceOrder);
          return next;
        });
        sendProgress(lesson.id, block.sequenceOrder);
      }
    };

  const onVideoEnded = (block: LessonBlock) => () => {
    if (!lesson) return;
    setCompletedSeqs((prev) => {
      if (prev.has(block.sequenceOrder)) return prev;
      const next = new Set(prev);
      next.add(block.sequenceOrder);
      return next;
    });
    sendProgress(lesson.id, block.sequenceOrder);
  };

  const blocks = useMemo<LessonBlock[]>(() => {
    if (!lesson?.lessonBlocks) return [];
    return lesson.lessonBlocks
      .slice()
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [lesson]);

  if (loading) {
    return (
      <div className={s.skeleton}>
        <div className={s.skelLine} />
        <div className={s.skelBox} />
        <div className={s.skelLine} style={{ width: "70%" }} />
      </div>
    );
  }

  if (!lesson) return null;

  const lessonLocked = lesson.isLocked && !lesson.isFree;

  if (lessonLocked) {
    return (
      <PaywallOverlay
        variant="fullscreen"
        title={
          lang === "ru"
            ? "Этот урок доступен по подписке"
            : lang === "en"
              ? "This lesson is available with a subscription"
              : "Bu dars obuna orqali ochiladi"
        }
        description={
          lang === "ru"
            ? "Получите полный доступ ко всем урокам, видео и материалам."
            : lang === "en"
              ? "Get full access to all lessons, videos and materials."
              : "Barcha darslar, video va materiallarga to‘liq kirishni qo‘lga kiriting."
        }
      />
    );
  }

  return (
    <div className={s.list}>
      {msgCtx}
      {blocks.length === 0 ? (
        <div className={s.empty}>
          {lang === "ru"
            ? "Нет содержимого"
            : lang === "en"
              ? "No content"
              : "Kontent yo‘q"}
        </div>
      ) : (
        blocks.map((block, idx) => {
          const isVideo = block.blockType === "VIDEO";
          // A block is "completed" if either:
          //  - the user just finished it locally in this session, or
          //  - the server's saved progress already covers this block's
          //    sequenceOrder. This makes ✓ marks survive a page reload
          //    regardless of how the backend numbers sequenceOrder.
          const serverCovers =
            !!savedProgress &&
            block.sequenceOrder <= savedProgress.lastBlockSequence;
          const completed =
            completedSeqs.has(block.sequenceOrder) || serverCovers;
          return (
            <article key={block.id} className={s.card}>
              <header className={s.cardHeader}>
                <span className={s.seq}>#{idx + 1}</span>
                <span className={s.kind}>
                  {blockLabel(block.blockType, lang)}
                </span>
                {block.isFree && (
                  <span className={s.freeBadge}>
                    {lang === "ru" ? "БЕСПЛАТНО" : lang === "en" ? "FREE" : "BEPUL"}
                  </span>
                )}
              </header>

              <div className={s.cardBody}>
                <LessonBlockRenderer
                  block={block}
                  lang={lang}
                  onUrlExpired={onUrlExpired}
                  onVideoEnded={isVideo ? onVideoEnded(block) : undefined}
                  onVideoProgress={isVideo ? onVideoProgress(block) : undefined}
                />
              </div>

              <footer className={s.cardFooter}>
                <div className={s.footLeft}>
                  {isVideo && block.duration != null && (
                    <span className={s.duration}>
                      {formatDuration(block.duration)}
                    </span>
                  )}
                </div>
                <div className={s.footRight}>
                  {completed && (
                    <span className={s.doneBadge}>
                      <CheckCircleFilled />
                      {lang === "ru"
                        ? "Завершено"
                        : lang === "en"
                          ? "Completed"
                          : "Tugatildi"}
                    </span>
                  )}
                </div>
              </footer>
            </article>
          );
        })
      )}
    </div>
  );
};

export default BlocksList;
