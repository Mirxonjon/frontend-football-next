import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type BookCategoryType = "BOOK" | "KONSPEKT";

export type BookCategory = {
  id: number;
  titleUz: string;
  titleRu: string;
  categoryType: BookCategoryType;
  createdAt: string;
  updatedAt: string;
};

export type BookSort =
  | "newest"
  | "oldest"
  | "priceAsc"
  | "priceDesc";

type BookCategoriesState = {
  items: BookCategory[];
  loading: boolean;
  error: string;
  search: string;
  selectedType: BookCategoryType | "ALL";
  selectedCategoryId: number | null;
  sort: BookSort;
  hasDiscount: boolean;
  freeOnly: boolean;
};

type FetchArgs = {
  search?: string;
  categoryType?: BookCategoryType;
};

export const fetchBookCategories = createAsyncThunk<
  BookCategory[],
  FetchArgs | undefined,
  { rejectValue: string }
>("bookCategories/fetch", async (args, { rejectWithValue }) => {
  try {
    const params: Record<string, any> = {};
    if (args?.search) params.search = args.search;
    if (args?.categoryType) params.categoryType = args.categoryType;
    const res = await FT_API.get<{ status_code: number; data: BookCategory[] }>(
      "/book-categories",
      { params }
    );
    return res.data?.data ?? [];
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load book categories"
    );
  }
});

const initialState: BookCategoriesState = {
  items: [],
  loading: false,
  error: "",
  search: "",
  selectedType: "ALL",
  selectedCategoryId: null,
  sort: "newest",
  hasDiscount: false,
  freeOnly: false,
};

const slice = createSlice({
  name: "bookCategories",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setType: (state, action: PayloadAction<BookCategoryType | "ALL">) => {
      state.selectedType = action.payload;
      state.selectedCategoryId = null;
    },
    setSelectedCategoryId: (state, action: PayloadAction<number | null>) => {
      state.selectedCategoryId = action.payload;
    },
    setSort: (state, action: PayloadAction<BookSort>) => {
      state.sort = action.payload;
    },
    setHasDiscount: (state, action: PayloadAction<boolean>) => {
      state.hasDiscount = action.payload;
    },
    setFreeOnly: (state, action: PayloadAction<boolean>) => {
      state.freeOnly = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookCategories.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchBookCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBookCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });
  },
});

export const bookCategoriesActions = slice.actions;
export const bookCategoriesReducer = slice.reducer;
