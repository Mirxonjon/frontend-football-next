import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from "axios";
import { tokens } from "./tokens";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4021/v1/";

// Strip a single trailing slash so we can safely append `/auth/refresh`
// for the bare-axios refresh call below without ending up with a double //.
const STRIPPED_BASE = BASE_URL.replace(/\/+$/, "");

const FT_API = axios.create({
  baseURL: BASE_URL,
  params: {
    key: process.env.NEXT_PUBLIC_YT_API_KEY,
  },
});

// ─── Request: attach Bearer on every request ────────────────────────────
// Read the token fresh on every request so login / logout take effect
// immediately (no module-load caching).
FT_API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = tokens.access;
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
      config.headers.set("authorization", `Bearer ${token}`);
    }
  }
  return config;
});

// ─── Response: 401 → refresh → retry  ───────────────────────────────────
// One refresh in flight at a time. Other requests that 401 in the meantime
// queue up and resume with the freshly issued accessToken.

let isRefreshing = false;
let waiters: Array<(newAccess: string | null) => void> = [];
const flushWaiters = (token: string | null) => {
  for (const w of waiters) w(token);
  waiters = [];
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  // Avoid bouncing the user away from the login page itself.
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login";
};

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

FT_API.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = (error.config ?? {}) as RetryConfig;
    const status = error.response?.status;

    // The refresh call itself failing means the session is dead.
    const isRefreshCall =
      typeof original.url === "string" &&
      original.url.includes("/auth/refresh");
    if (isRefreshCall) {
      tokens.clear();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokens.refresh;
    if (!refreshToken) {
      tokens.clear();
      redirectToLogin();
      return Promise.reject(error);
    }

    original._retry = true;

    // Queue parallel 401s behind the in-flight refresh.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((newAccess) => {
          if (!newAccess) return reject(error);
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization =
            `Bearer ${newAccess}`;
          resolve(FT_API(original));
        });
      });
    }

    isRefreshing = true;
    try {
      // Use a bare axios.post so the refresh call itself doesn't go through
      // this same interceptor stack and recurse on its own 401s.
      const resp = await axios.post<{
        status_code?: number;
        data: {
          accessToken: string;
          refreshToken?: string;
          expiresIn?: number;
        };
      }>(`${STRIPPED_BASE}/auth/refresh`, { refreshToken });

      const data = resp.data?.data;
      if (!data?.accessToken) throw new Error("No accessToken in refresh response");

      tokens.save({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      flushWaiters(data.accessToken);

      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization =
        `Bearer ${data.accessToken}`;
      return FT_API(original);
    } catch (refreshErr) {
      flushWaiters(null);
      tokens.clear();
      redirectToLogin();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default FT_API;
