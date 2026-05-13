import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Lang = "uz" | "ru" | "en";

const STORAGE_KEY = "lang";
const VALID: Lang[] = ["uz", "ru", "en"];

const readInitialLang = (): Lang => {
  if (typeof window === "undefined") return "uz";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (VALID as string[]).includes(stored)) {
      return stored as Lang;
    }
  } catch {
    /* ignore */
  }
  return "uz";
};

interface LangState {
  lang: Lang;
}

const initialState: LangState = {
  lang: readInitialLang(),
};

export const { actions: langActions, reducer: langReducers } = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLang: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, action.payload);
        } catch {
          /* ignore */
        }
      }
    },
  },
});
