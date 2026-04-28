import axios, { type InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4021/api/v1/";

const FT_API = axios.create({
  baseURL: BASE_URL,
  params: {
    key: process.env.NEXT_PUBLIC_YT_API_KEY,
  },
});

// Read auth token from localStorage on every request — fixes the bug where
// the old token was cached at module load and survived login/logout.
FT_API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
      config.headers.set("authorization", `Bearer ${token}`);
    }
  }
  return config;
});

export default FT_API;
