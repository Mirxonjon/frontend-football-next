"use client";

import { useSelector } from "react-redux";
import type { Lang } from "../store/slice/lang";

/**
 * Tri-language helper hook.
 *
 * Usage:
 *   const t = useT();
 *   t("Bepul", "Бесплатно", "Free")
 *   t("Bepul", "Бесплатно") // → falls back to UZ for "en"
 *
 * - When current lang is "ru"     → returns `ru`
 * - When current lang is "en"     → returns `en` if provided, else `uz`
 * - Otherwise                     → returns `uz`
 */
export function useT() {
  const lang = useSelector(
    (state: any) => (state?.lang?.lang ?? "uz") as Lang
  );

  return (uz: string, ru: string, en?: string): string => {
    if (lang === "ru") return ru;
    if (lang === "en") return en ?? uz;
    return uz;
  };
}

/** Field-suffix helper aware of all 3 languages.
 *
 * - "ru" → field + "Ru" (e.g. titleRu)
 * - "en" → field + "En" if backend provides it, otherwise base field (UZ)
 * - else → base field (UZ)
 *
 * Pass `hasEnField=true` only when you know the API has a separate _En column.
 */
export function useLocalizedField() {
  const lang = useSelector(
    (state: any) => (state?.lang?.lang ?? "uz") as Lang
  );

  return <T extends Record<string, any>>(
    obj: T | null | undefined,
    field: string,
    hasEnField = false
  ): string => {
    if (!obj) return "";
    if (lang === "ru") {
      const ruKey = `${field}Ru`;
      return (obj as any)[ruKey] ?? (obj as any)[field] ?? "";
    }
    if (lang === "en" && hasEnField) {
      const enKey = `${field}En`;
      return (obj as any)[enKey] ?? (obj as any)[field] ?? "";
    }
    return (obj as any)[field] ?? "";
  };
}
