"use client";

import { useState } from "react";
import {
  PictureOutlined,
  PaperClipOutlined,
  BulbOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import PaywallOverlay from "../PaywallOverlay/PaywallOverlay";
import type { LessonBlock } from "../../../store/lessons/lessonsSlice";
import s from "./LessonBlockRenderer.module.scss";

const isValidHttpUrl = (raw: string | null | undefined): string | null => {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("blob:") ||
    t.startsWith("/")
  ) {
    return t;
  }
  return null;
};

const SafeImage = ({ src, lang }: { src: string; lang: string }) => {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className={s.mediaUnavailable}>
        <PictureOutlined className={s.mediaUnavailableIcon} />
        <div className={s.mediaUnavailableTitle}>
          {lang === "ru"
            ? "Изображение недоступно"
            : lang === "en"
              ? "Image not available"
              : "Rasm mavjud emas"}
        </div>
        <div className={s.mediaUnavailableSub}>
          {lang === "ru"
            ? "Файл не найден или ссылка не валидна"
            : lang === "en"
              ? "File not found or link is invalid"
              : "Fayl topilmadi yoki havola notoʻgʻri"}
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="lesson"
      className={s.image}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};

const SafeFileLink = ({
  href,
  lang,
}: {
  href: string;
  lang: string;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={s.fileLink}
    >
      {lang === "ru"
        ? "Скачать материал"
        : lang === "en"
          ? "Download material"
          : "Materialni yuklab olish"}
    </a>
  );
};

type Props = {
  block: LessonBlock;
  lang: "uz" | "ru" | string;
  onVideoEnded?: () => void;
  onVideoProgress?: (currentSec: number, totalSec: number) => void;
  onUrlExpired?: () => void;
};

const TextBlock = ({ content }: { content: string | null }) => {
  if (!content) return null;
  // Lightweight markdown-ish rendering: paragraphs by blank lines, line breaks preserved.
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className={s.textBody}>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ whiteSpace: "pre-wrap" }}>
          {p}
        </p>
      ))}
    </div>
  );
};

const LessonBlockRenderer = ({
  block,
  lang,
  onVideoEnded,
  onVideoProgress,
  onUrlExpired,
}: Props) => {
  // Backend has no _En column; English falls back to UZ.
  const content = lang === "ru" ? block.contentRu : block.contentUz;

  // Locked block — paywall
  if (block.isLocked) {
    return (
      <div className={`${s.lockedShell} ${s.aspectAuto}`}>
        <div className={s.lockedPlaceholder}>
          <span className={s.typeLabel}>
            {labelFor(block.blockType, lang)}
          </span>
        </div>
        <PaywallOverlay variant="block" />
      </div>
    );
  }

  switch (block.blockType) {
    case "TITLE":
      return <h2 className={s.title}>{content}</h2>;

    case "TEXT":
      return <TextBlock content={content} />;

    case "VIDEO": {
      const url = isValidHttpUrl(content);
      if (!url) {
        return (
          <div className={s.mediaUnavailable}>
            <PlayCircleOutlined className={s.mediaUnavailableIcon} />
            <div className={s.mediaUnavailableTitle}>
              {lang === "ru"
                ? "Видео недоступно"
                : lang === "en"
                  ? "Video not available"
                  : "Video mavjud emas"}
            </div>
            <div className={s.mediaUnavailableSub}>
              {lang === "ru"
                ? "Файл ещё не загружен или ссылка не валидна"
                : lang === "en"
                  ? "File hasn't been uploaded yet or the link is invalid"
                  : "Fayl hali yuklanmagan yoki havola notoʻgʻri"}
            </div>
          </div>
        );
      }
      return (
        <div className={s.videoWrap}>
          <VideoPlayer
            src={url}
            duration={block.duration}
            onEnded={onVideoEnded}
            onProgress={onVideoProgress}
            onUrlExpired={onUrlExpired}
          />
          {block.isFree && (
            <span className={s.previewPill}>
              {lang === "ru"
                ? "БЕСПЛАТНО"
                : lang === "en"
                  ? "FREE PREVIEW"
                  : "BEPUL NAMOYISH"}
            </span>
          )}
        </div>
      );
    }

    case "IMAGE": {
      const url = isValidHttpUrl(content);
      if (!url) {
        return (
          <div className={s.mediaUnavailable}>
            <PictureOutlined className={s.mediaUnavailableIcon} />
            <div className={s.mediaUnavailableTitle}>
              {lang === "ru"
            ? "Изображение недоступно"
            : lang === "en"
              ? "Image not available"
              : "Rasm mavjud emas"}
            </div>
          </div>
        );
      }
      return <SafeImage src={url} lang={lang} />;
    }

    case "FILE": {
      const url = isValidHttpUrl(content);
      return (
        <div className={s.fileBlock}>
          <PaperClipOutlined className={s.fileIcon} />
          {url ? (
            <SafeFileLink href={url} lang={lang} />
          ) : (
            <span className={s.fileMissing}>
              {lang === "ru"
                ? "Материал ещё не загружен"
                : lang === "en"
                  ? "Material hasn't been uploaded yet"
                  : "Material hali yuklanmagan"}
            </span>
          )}
        </div>
      );
    }

    case "HINT":
      return (
        <div className={s.hint}>
          <BulbOutlined className={s.hintIcon} />
          <div>{content}</div>
        </div>
      );

    default:
      return (
        <div className={s.placeholder}>
          <FileTextOutlined />
          <span>{block.blockType}</span>
        </div>
      );
  }
};

const labelFor = (type: string, lang: string) => {
  const map: Record<string, { uz: string; ru: string; en: string }> = {
    TITLE: { uz: "Sarlavha", ru: "Заголовок", en: "Title" },
    TEXT: { uz: "Matn", ru: "Текст", en: "Text" },
    VIDEO: { uz: "Video", ru: "Видео", en: "Video" },
    IMAGE: { uz: "Rasm", ru: "Изображение", en: "Image" },
    FILE: { uz: "Fayl", ru: "Файл", en: "File" },
    HINT: { uz: "Maslahat", ru: "Подсказка", en: "Hint" },
  };
  const item = map[type];
  if (!item) return type;
  if (lang === "ru") return item.ru;
  if (lang === "en") return item.en;
  return item.uz;
};

export default LessonBlockRenderer;
