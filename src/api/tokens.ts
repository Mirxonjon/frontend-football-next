/**
 * Token storage helper. Uses the same localStorage keys the rest of the app
 * already writes to (login/register/Google auth/header logout) so this is a
 * non-breaking refactor — the keys stay the same; we just centralise reads.
 */

const ACCESS_KEY = "token";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const safeRemove = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const tokens = {
  get access(): string | null {
    return safeGet(ACCESS_KEY);
  },
  get refresh(): string | null {
    return safeGet(REFRESH_KEY);
  },

  /** Save a fresh `{accessToken, refreshToken}` pair after login or refresh. */
  save(t: { accessToken: string; refreshToken?: string }) {
    if (t?.accessToken) safeSet(ACCESS_KEY, t.accessToken);
    if (t?.refreshToken) safeSet(REFRESH_KEY, t.refreshToken);
  },

  /** Wipe everything we treat as session state. */
  clear() {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
    safeRemove(USER_KEY);
  },
};

export const TOKEN_KEYS = {
  ACCESS_KEY,
  REFRESH_KEY,
  USER_KEY,
} as const;
