import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type Card = {
  id: number;
  last4: string;
  cardNumber: string | null;
  expireDate: string | null;
  phoneNumber: string | null;
  provider: "click";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
};

export type InitCardResponse = {
  cardId: number;
  phoneNumber: string | null;
  cardNumberMasked: string;
  expiresInSeconds: number;
};

type CardsState = {
  list: Card[];
  loading: boolean;
  error: string;
};

export const fetchCards = createAsyncThunk<
  Card[],
  void,
  { rejectValue: string }
>("cards/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{ status_code: number; data: Card[] }>(
      "/cards"
    );
    return res.data?.data ?? [];
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load cards"
    );
  }
});

export const initCard = createAsyncThunk<
  InitCardResponse,
  { cardNumber: string; expireDate: string },
  { rejectValue: string }
>("cards/init", async (body, { rejectWithValue }) => {
  try {
    const res = await FT_API.post<{
      status_code: number;
      data: InitCardResponse;
    }>("/cards/init", body);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Karta notoʻgʻri"
    );
  }
});

export const verifyCard = createAsyncThunk<
  Card,
  { cardId: number; smsCode: string },
  { rejectValue: string }
>("cards/verify", async (body, { rejectWithValue }) => {
  try {
    const res = await FT_API.post<{ status_code: number; data: Card }>(
      "/cards/verify",
      body
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Kod notoʻgʻri"
    );
  }
});

export const deleteCard = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("cards/delete", async (cardId, { rejectWithValue }) => {
  try {
    await FT_API.delete(`/cards/${cardId}`);
    return cardId;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Kartani oʻchirib boʻlmadi"
    );
  }
});

const initialState: CardsState = {
  list: [],
  loading: false,
  error: "",
};

const slice = createSlice({
  name: "cards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })
      .addCase(verifyCard.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) {
          state.list[idx] = { ...state.list[idx], ...action.payload };
        } else {
          state.list.unshift(action.payload as Card);
        }
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      });
  },
});

export const cardsActions = slice.actions;
export const cardsReducer = slice.reducer;
