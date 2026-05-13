import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";
import type {
  BookCategory,
  BookCategoryType,
} from "../bookCategories/bookCategoriesSlice";

export type DiscountType =
  | "NONE"
  | "PERCENT"
  | "PERCENTAGE"
  | "FIXED"
  | "FIXED_PRICE";

const isPercentDiscount = (t: DiscountType) =>
  t === "PERCENT" || t === "PERCENTAGE";

const isFixedDiscount = (t: DiscountType) =>
  t === "FIXED" || t === "FIXED_PRICE";

export type Book = {
  id: number;
  bookCategoryId: number;
  titleUz: string;
  titleRu: string;
  fileUrl: string | null;
  basePrice: number;
  discountType: DiscountType;
  discountPercent: number;
  fixedDiscountPrice: number | null;
  coverImageUrl: string | null;
  descriptionUz: string;
  descriptionRu: string;
  tacticHintImg: string | null;
  createdAt: string;
  updatedAt: string;
  bookCategory?: BookCategory;
};

export type BooksPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type BooksState = {
  items: Book[];
  loading: boolean;
  error: string;
  pagination: BooksPagination;
  current: Book | null;
  currentLoading: boolean;
  currentError: string;
  myBooks: any[];
  myBooksLoading: boolean;
  ownedBookIds: Record<number, true>;
};

export type BookSortBy = "id" | "createdAt" | "basePrice";
export type BookSortOrder = "asc" | "desc";

type FetchArgs = {
  page?: number;
  limit?: number;
  all?: boolean;
  categoryId?: number | null;
  search?: string;
  categoryType?: BookCategoryType;
  sortBy?: BookSortBy;
  sortOrder?: BookSortOrder;
  hasDiscount?: boolean;
  isFree?: boolean;
};

type FetchResult = {
  items: Book[];
  pagination: BooksPagination | null;
};

const normalize = (
  raw: any,
  fallbackPage: number,
  fallbackLimit: number
): FetchResult => {
  let items: Book[] = [];
  let meta: any = null;

  if (Array.isArray(raw?.data)) {
    items = raw.data;
    meta = raw.meta ?? raw.pagination ?? null;
  } else if (raw?.data?.items && Array.isArray(raw.data.items)) {
    items = raw.data.items;
    meta = raw.data.meta ?? raw.data.pagination ?? null;
  }

  if (!meta) {
    return {
      items,
      pagination: {
        page: fallbackPage,
        limit: fallbackLimit,
        total: items.length,
        totalPages: 1,
      },
    };
  }

  const limit = Number(meta.limit ?? meta.pageSize ?? fallbackLimit);
  const total = Number(meta.total ?? meta.totalItems ?? items.length);
  return {
    items,
    pagination: {
      page: Number(meta.page ?? meta.currentPage ?? fallbackPage),
      limit,
      total,
      totalPages: Number(
        meta.totalPages ?? Math.max(1, Math.ceil(total / limit))
      ),
    },
  };
};

export const fetchBooks = createAsyncThunk<
  FetchResult,
  FetchArgs | undefined,
  { state: any; rejectValue: string }
>("books/fetch", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState().books as BooksState;
    const page = args?.page ?? state.pagination.page;
    const limit = args?.limit ?? state.pagination.limit;

    const params: Record<string, any> = {};
    if (args?.all) {
      params.all = true;
    } else {
      params.page = page;
      params.limit = limit;
    }
    if (args?.categoryId != null) params.categoryId = args.categoryId;
    if (args?.search) params.search = args.search;
    if (args?.categoryType) params.categoryType = args.categoryType;
    if (args?.sortBy) params.sortBy = args.sortBy;
    if (args?.sortOrder) params.sortOrder = args.sortOrder;
    if (args?.hasDiscount) params.hasDiscount = true;
    if (args?.isFree) params.isFree = true;

    const res = await FT_API.get("/books", { params });
    return normalize(res.data, page, limit);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to load books"
    );
  }
});

export type UserBook = {
  id: number;
  userId: number;
  bookId: number;
  transactionId: number | null;
  acquiredAt: string;
  isActive: boolean;
  book: Book;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseResult = {
  userBook: UserBook;
  transaction: {
    id: number;
    amount: number;
    status: "SUCCESS";
  } | null;
};

export const purchaseBook = createAsyncThunk<
  PurchaseResult,
  { bookId: number; cardId?: number },
  { rejectValue: { code?: number; message: string; raw?: any } }
>("books/purchase", async ({ bookId, cardId }, { rejectWithValue }) => {
  try {
    const res = await FT_API.post<{ status_code: number; data: PurchaseResult }>(
      `/me/books/${bookId}/purchase`,
      cardId ? { cardId } : {}
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      code: err?.response?.status,
      message:
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Payment failed",
      raw: err?.response?.data,
    });
  }
});

export const fetchDownloadUrl = createAsyncThunk<
  { url: string; expiresInSec: number },
  number,
  { rejectValue: string }
>("books/getDownloadUrl", async (bookId, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: { url: string; expiresInSec: number };
    }>(`/me/books/${bookId}/download`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to get download URL"
    );
  }
});

export const fetchMyBooks = createAsyncThunk<
  UserBook[],
  void,
  { rejectValue: string }
>("books/fetchMine", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{ status_code: number; data: UserBook[] }>(
      "/me/books"
    );
    return res.data?.data ?? [];
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load your books"
    );
  }
});

export const fetchBookById = createAsyncThunk<
  Book,
  number | string,
  { rejectValue: string }
>("books/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{ status_code: number; data: Book }>(
      `/books/${id}`
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to load book"
    );
  }
});

const initialState: BooksState = {
  items: [],
  loading: false,
  error: "",
  pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  current: null,
  currentLoading: false,
  currentError: "",
  myBooks: [],
  myBooksLoading: false,
  ownedBookIds: {},
};

const slice = createSlice({
  name: "books",
  initialState,
  reducers: {
    setPage: (state, action: { payload: number; type: string }) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: { payload: number; type: string }) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    resetPage: (state) => {
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })
      .addCase(fetchBookById.pending, (state) => {
        state.currentLoading = true;
        state.currentError = "";
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload || "Error";
      })
      .addCase(fetchMyBooks.pending, (state) => {
        state.myBooksLoading = true;
      })
      .addCase(fetchMyBooks.fulfilled, (state, action) => {
        state.myBooksLoading = false;
        state.myBooks = action.payload;
        const map: Record<number, true> = {};
        action.payload.forEach((ub) => {
          if (ub.isActive !== false) map[ub.bookId] = true;
        });
        state.ownedBookIds = map;
      })
      .addCase(fetchMyBooks.rejected, (state) => {
        state.myBooksLoading = false;
      })
      .addCase(purchaseBook.fulfilled, (state, action) => {
        const ub = action.payload.userBook;
        if (ub?.bookId != null) state.ownedBookIds[ub.bookId] = true;
        // Prepend to myBooks if not already there
        if (ub && !state.myBooks.find((x: any) => x.id === ub.id)) {
          state.myBooks.unshift(ub as any);
        }
      });
  },
});

// Backwards-compatible exports kept for legacy imports.
export const booksActions = {
  ...slice.actions,
  setSelectedCategory: (_: any) => ({ type: "books/legacyNoop", payload: _ }),
  setSearch: (_: any) => ({ type: "books/legacyNoop", payload: _ }),
};
export const booksReducers = slice.reducer;
export const booksReducer = slice.reducer;

// ─── Helpers ────────────────────────────────────────────────

export const computeDisplayPrice = (book: Book): number => {
  if (isFixedDiscount(book.discountType) && book.fixedDiscountPrice != null) {
    return book.fixedDiscountPrice;
  }
  if (isPercentDiscount(book.discountType) && book.discountPercent > 0) {
    const off = (book.basePrice * book.discountPercent) / 100;
    return Math.max(0, Math.round(book.basePrice - off));
  }
  return book.basePrice;
};

export const hasDiscount = (book: Book): boolean => {
  return (
    (isFixedDiscount(book.discountType) &&
      book.fixedDiscountPrice != null &&
      book.fixedDiscountPrice < book.basePrice) ||
    (isPercentDiscount(book.discountType) && book.discountPercent > 0)
  );
};

export const isPercentDiscountType = (t: DiscountType) => isPercentDiscount(t);
export const isFixedDiscountType = (t: DiscountType) => isFixedDiscount(t);

export const formatPrice = (n: number, lang: string = "uz"): string => {
  if (n <= 0) return lang === "ru" ? "Бесплатно" : "Bepul";
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} so'm`;
};
