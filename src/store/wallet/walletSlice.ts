import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type WalletTransaction = {
  id: number;
  amount: number;
  status: PaymentStatus;
  provider: "click" | "dev" | null;
  externalId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  subscriptionsPlansId: number | null;
  createdAt: string;
};

export type WalletPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type WalletState = {
  list: WalletTransaction[];
  loading: boolean;
  error: string;
  pagination: WalletPagination;
};

type FetchArgs = {
  page?: number;
  limit?: number;
};

const normalize = (
  raw: any,
  fallbackPage: number,
  fallbackLimit: number
): { items: WalletTransaction[]; pagination: WalletPagination } => {
  const items: WalletTransaction[] = Array.isArray(raw?.data) ? raw.data : [];
  const meta = raw?.meta ?? raw?.pagination;
  const limit = Number(meta?.limit ?? fallbackLimit);
  const total = Number(meta?.total ?? items.length);
  return {
    items,
    pagination: {
      page: Number(meta?.page ?? fallbackPage),
      limit,
      total,
      totalPages: Number(
        meta?.totalPages ?? Math.max(1, Math.ceil(total / limit))
      ),
    },
  };
};

export const fetchWalletTransactions = createAsyncThunk<
  { items: WalletTransaction[]; pagination: WalletPagination },
  FetchArgs | undefined,
  { state: any; rejectValue: string }
>("wallet/fetchList", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState().wallet as WalletState;
    const page = args?.page ?? state.pagination.page;
    const limit = args?.limit ?? state.pagination.limit;
    const res = await FT_API.get("/wallet/transactions", {
      params: { page, limit },
    });
    return normalize(res.data, page, limit);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load transactions"
    );
  }
});

const initialState: WalletState = {
  list: [],
  loading: false,
  error: "",
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

const slice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setPage: (state, action: { payload: number; type: string }) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: { payload: number; type: string }) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });
  },
});

export const walletActions = slice.actions;
export const walletReducer = slice.reducer;

export const formatAmount = (n: number): string => {
  if (!Number.isFinite(n)) return "0";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
