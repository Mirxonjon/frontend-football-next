/**
 * Tiny stale-while-revalidate cache backed by localStorage.
 *
 * Matters for slow / metered connections: the second visit can paint from
 * the cached snapshot instantly while a fresh fetch runs in the background
 * and refreshes the cache for next time.
 *
 * Usage:
 *   const cached = readCache<Plan[]>("plans:list", 5 * 60_000);
 *   if (cached) dispatch({ type: "plans/list/fulfilled", payload: cached });
 *   const fresh = await fetchPlans();
 *   writeCache("plans:list", fresh);
 *
 * Don't store sensitive data here (no tokens, no PII): localStorage is
 * readable by any script on the same origin.
 */

const PREFIX = "cz:cache:v1:";

type Stored<T> = {
  v: number; // schema version, bump on shape change
  t: number; // saved-at epoch ms
  d: T; // payload
};

const SCHEMA_VERSION = 1;

const safeParse = <T,>(raw: string): Stored<T> | null => {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.t === "number" &&
      parsed.v === SCHEMA_VERSION &&
      "d" in parsed
    ) {
      return parsed as Stored<T>;
    }
  } catch {
    /* corrupted entry */
  }
  return null;
};

/**
 * Read a cached value if it's still within `maxAgeMs`. Returns `null` if
 * missing, expired, corrupted, or running on the server.
 */
export const readCache = <T,>(
  key: string,
  maxAgeMs: number
): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = safeParse<T>(raw);
    if (!parsed) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    if (Date.now() - parsed.t > maxAgeMs) {
      // Expired — caller will refetch; we keep the entry around as a SWR
      // fallback only if they explicitly read with `readStale`.
      return null;
    }
    return parsed.d;
  } catch {
    return null;
  }
};

/**
 * Read a cached value regardless of age. Useful for showing something
 * immediately while a fresh request runs. Pair with `writeCache` after
 * the fresh request resolves.
 */
export const readStale = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = safeParse<T>(raw);
    return parsed ? parsed.d : null;
  } catch {
    return null;
  }
};

export const writeCache = <T,>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  try {
    const payload: Stored<T> = {
      v: SCHEMA_VERSION,
      t: Date.now(),
      d: data,
    };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch {
    // Storage full / private mode — caching is best-effort.
  }
};

export const clearCache = (key?: string): void => {
  if (typeof window === "undefined") return;
  try {
    if (key) {
      window.localStorage.removeItem(PREFIX + key);
      return;
    }
    // Wipe all entries owned by this cache namespace.
    const ls = window.localStorage;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) ls.removeItem(k);
  } catch {
    /* ignore */
  }
};
