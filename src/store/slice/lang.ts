import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Lang = "uz" | "ru";

interface LangState {
  lang: Lang;
}

const initialState: LangState = {
  lang: "uz",
};

export const { actions: langActions, reducer: langReducers } = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLang: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload;
    },
  },
});
