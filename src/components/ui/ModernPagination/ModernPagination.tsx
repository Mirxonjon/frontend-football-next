"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import s from "./ModernPagination.module.scss";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

const buildPages = (current: number, totalPages: number): (number | "…")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);

  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");

  pages.push(totalPages);
  return pages;
};

const ModernPagination = ({
  page,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [8, 12, 24, 48],
}: Props) => {
  const lang = useSelector((state: any) => state.lang.lang);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  const txt = {
    showing:
      lang === "ru" ? "Показано" : lang === "en" ? "Showing" : "Koʻrsatilmoqda",
    of: lang === "ru" ? "из" : lang === "en" ? "of" : "/",
    results:
      lang === "ru" ? "результатов" : lang === "en" ? "results" : "natija",
    perPage:
      lang === "ru" ? "на странице" : lang === "en" ? "per page" : "sahifada",
    page: lang === "ru" ? "Стр." : lang === "en" ? "Page" : "Sah.",
  };

  if (total === 0) return null;

  const goPrev = () => page > 1 && onChange(page - 1);
  const goNext = () => page < totalPages && onChange(page + 1);

  return (
    <div className={s.root}>
      <div className={s.info}>
        <span className={s.range}>
          {start}–{end}
        </span>
        <span className={s.divider}>{txt.of}</span>
        <span className={s.total}>{total}</span>
        <span className={s.label}>{txt.results}</span>
      </div>

      <div className={s.pages}>
        <button
          type="button"
          className={`${s.navBtn} ${page === 1 ? s.disabled : ""}`}
          onClick={goPrev}
          disabled={page === 1}
          aria-label="Previous"
        >
          <LeftOutlined />
        </button>

        <div className={s.numbers}>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className={s.ellipsis}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`${s.numBtn} ${p === page ? s.active : ""}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className={`${s.navBtn} ${page === totalPages ? s.disabled : ""}`}
          onClick={goNext}
          disabled={page === totalPages}
          aria-label="Next"
        >
          <RightOutlined />
        </button>
      </div>

      {onPageSizeChange && (
        <div className={s.sizeWrap}>
          <span className={s.sizeLabel}>{txt.perPage}:</span>
          <div className={s.sizeChips}>
            {pageSizeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${s.sizeChip} ${opt === pageSize ? s.active : ""}`}
                onClick={() => onPageSizeChange(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernPagination;
