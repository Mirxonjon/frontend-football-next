"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";
import { Link, useParams } from "@/lib/router-compat";
import {
  fetchLegalDocumentByType,
  fetchLegalDocuments,
  legalContent,
  legalTitle,
  parseTypeFromSlug,
  type LegalDocument,
  type LegalDocumentType,
} from "../../store/legal/legalSlice";
import s from "./LegalDocumentPage.module.scss";

/* ───────── Tiny markdown → HTML ─────────
 * Backend may serve markdown OR raw HTML. This renderer covers the common
 * markdown subset (headings, lists, bold/italic, links, paragraphs, code)
 * and leaves raw HTML alone, which is enough for legal docs. */

const escapeHtml = (raw: string) =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s.trim());

const renderInline = (line: string): string => {
  // Order matters: process code first to protect inner content.
  let out = line
    .replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, label, href) =>
        `<a href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    );
  return out;
};

const markdownToHtml = (raw: string): string => {
  if (!raw) return "";
  if (looksLikeHtml(raw)) return raw; // backend already sent HTML

  const escaped = escapeHtml(raw);
  const lines = escaped.split(/\r?\n/);
  const blocks: string[] = [];
  let para: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(`<p>${renderInline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listOrdered ? "ol" : "ul";
    blocks.push(
      `<${tag}>${listItems
        .map((item) => `<li>${renderInline(item)}</li>`)
        .join("")}</${tag}>`
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listOrdered) flushList();
      listOrdered = false;
      listItems.push(ul[1]);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!listOrdered) flushList();
      listOrdered = true;
      listItems.push(ol[1]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();

  return blocks.join("\n");
};

const formatDate = (iso: string, lang: "uz" | "ru" | "en"): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const locale =
      lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const LegalDocumentPage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ type: string }>();
  const slug = params?.type ?? "";
  const type: LegalDocumentType | null = parseTypeFromSlug(slug);

  const lang = useSelector(
    (state: any) => state.lang.lang
  ) as "uz" | "ru" | "en";
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const doc = useSelector((state: any) =>
    type
      ? ((state.legal?.byType?.[type] ?? null) as LegalDocument | null)
      : null
  );
  const loading = useSelector(
    (state: any) => (state.legal?.currentLoading ?? false) as boolean
  );

  useEffect(() => {
    if (!type) return;
    dispatch(fetchLegalDocumentByType(type));
    // Also seed list so the sidebar can show siblings.
    dispatch(fetchLegalDocuments());
  }, [dispatch, type]);

  const html = useMemo(() => {
    if (!doc) return "";
    return markdownToHtml(legalContent(doc, lang));
  }, [doc, lang]);

  if (!type) {
    return (
      <Container>
        <NotFound
          subTitle={t("Hujjat topilmadi", "Документ не найден", "Document not found")}
        />
      </Container>
    );
  }

  if (loading && !doc) {
    return (
      <Container>
        <div className={s.loader}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  if (!doc) {
    return (
      <Container>
        <NotFound
          subTitle={t("Hujjat topilmadi", "Документ не найден", "Document not found")}
        />
      </Container>
    );
  }

  const title = legalTitle(doc, lang);

  return (
    <Container>
      <Helmet>
        <title>{title} — Coaching Zona</title>
      </Helmet>

      <article className={s.wrapper}>
        <Link to="/" className={s.back}>
          <ArrowLeftOutlined />
          <span>{t("Bosh sahifa", "На главную", "Home")}</span>
        </Link>

        <header className={s.header}>
          <h1 className={s.title}>{title}</h1>
          <div className={s.meta}>
            <span className={s.version}>v{doc.version}</span>
            <span className={s.dot} />
            <span className={s.date}>
              <CalendarOutlined />
              {formatDate(doc.publishedAt, lang)}
            </span>
          </div>
        </header>

        <div
          className={s.content}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </Container>
  );
};

export default LegalDocumentPage;
