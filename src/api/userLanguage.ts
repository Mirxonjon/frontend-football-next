import FT_API from "./api";
import { tokens } from "./tokens";
import type { Lang } from "../store/slice/lang";

/**
 * Best-effort PATCH `/users/me` to persist the user's language preference
 * server-side. Backend supports `"UZ" | "RU" | "EN"`. Logged-out users skip
 * — no token, no PATCH; the local choice still sticks via Redux/localStorage.
 *
 * Errors are swallowed: this is a UX nicety, not a critical flow. The user
 * already sees the language change immediately from the local state.
 */
export const syncUserLanguage = async (lang: Lang): Promise<void> => {
  if (typeof window === "undefined") return;
  if (!tokens.access) return; // anonymous — skip server sync
  if (lang !== "uz" && lang !== "ru" && lang !== "en") return;
  try {
    await FT_API.patch("/users/me", { language: lang.toUpperCase() });
    // Reflect the saved value back into the cached `user` object so the
    // header/profile UI stays consistent without a refetch.
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.language = lang.toUpperCase();
        window.localStorage.setItem("user", JSON.stringify(parsed));
      }
    } catch {
      /* ignore JSON or storage errors */
    }
  } catch {
    /* best-effort — keep local state regardless */
  }
};

/**
 * Convert backend `"UZ" | "RU"` enum to the frontend `Lang` type.
 * Returns `null` if the value isn't recognised so callers can fall back
 * to whatever they had (localStorage, default, etc.).
 */
export const langFromUserModel = (
  raw: string | null | undefined
): Lang | null => {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v === "uz" || v === "ru" || v === "en") return v as Lang;
  return null;
};
