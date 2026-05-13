import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type BlockType =
  | "TITLE"
  | "TEXT"
  | "VIDEO"
  | "IMAGE"
  | "FILE"
  | "HINT";

export type SortOrder = "asc" | "desc";
export type MasterclassCategorySortBy = "id" | "createdAt" | "masterclassCount";
export type MasterclassSortBy = "id" | "createdAt";

export type MasterclassCategory = {
  id: number;
  titleUz: string;
  titleRu: string;
  descriptionUz: string;
  descriptionRu: string;
  imageUrl: string | null;
  masterclassCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Masterclass = {
  id: number;
  masterclassCategoryId: number;
  titleUz: string;
  titleRu: string;
  createdAt: string;
  updatedAt: string;
  masterclassCategory?: MasterclassCategory;
};

export type MasterclassBlock = {
  id: number;
  masterclassId: number;
  blockType: BlockType;
  contentUz: string;
  contentRu: string;
  duration: number | null;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MasterclassDetail = Masterclass & {
  masterclassCategory: MasterclassCategory;
  blocks: MasterclassBlock[];
};

export type MasterclassPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MasterclassState = {
  list: Masterclass[];
  listLoading: boolean;
  listError: string;
  pagination: MasterclassPagination;
  sortBy: MasterclassSortBy;
  sortOrder: SortOrder;

  categories: MasterclassCategory[];
  categoriesLoading: boolean;

  search: string;
  selectedCategoryId: number | null;

  current: MasterclassDetail | null;
  currentLoading: boolean;
  currentError: string;
};

type ListArgs = {
  page?: number;
  limit?: number;
  all?: boolean;
  masterclassCategoryId?: number;
  search?: string;
  sortBy?: MasterclassSortBy;
  sortOrder?: SortOrder;
};

type FetchListResult = {
  items: Masterclass[];
  pagination: MasterclassPagination | null;
};

const normalize = <T,>(
  raw: any,
  fallbackPage: number,
  fallbackLimit: number
): { items: T[]; pagination: MasterclassPagination | null } => {
  let items: T[] = [];
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

export const fetchMasterclasses = createAsyncThunk<
  FetchListResult,
  ListArgs | undefined,
  { state: any; rejectValue: string }
>("masterclass/fetchList", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState().masterclass as MasterclassState;
    const page = args?.page ?? state.pagination.page;
    const limit = args?.limit ?? state.pagination.limit;
    const sortBy = args?.sortBy ?? state.sortBy;
    const sortOrder = args?.sortOrder ?? state.sortOrder;

    const params: Record<string, any> = {};
    if (args?.all) {
      params.all = true;
    } else {
      params.page = page;
      params.limit = limit;
    }
    if (args?.masterclassCategoryId != null)
      params.masterclassCategoryId = args.masterclassCategoryId;
    if (args?.search) params.search = args.search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const res = await FT_API.get("/masterclasses", { params });
    return normalize<Masterclass>(res.data, page, limit);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load masterclasses"
    );
  }
});

type CategoryArgs = {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  sortBy?: MasterclassCategorySortBy;
  sortOrder?: SortOrder;
  hasMasterclasses?: boolean;
  includeCount?: boolean;
};

export const fetchMasterclassCategories = createAsyncThunk<
  MasterclassCategory[],
  CategoryArgs | undefined,
  { rejectValue: string }
>("masterclass/fetchCategories", async (args, { rejectWithValue }) => {
  try {
    const params: Record<string, any> = {};
    // Default to fetching everything (no pagination needed for sidebar chips).
    if (args?.all !== false) {
      params.all = true;
    } else {
      if (args?.page != null) params.page = args.page;
      if (args?.limit != null) params.limit = args.limit;
    }
    if (args?.search) params.search = args.search;
    if (args?.sortBy) params.sortBy = args.sortBy;
    if (args?.sortOrder) params.sortOrder = args.sortOrder;
    if (args?.hasMasterclasses) params.hasMasterclasses = true;
    if (args?.includeCount !== false) params.includeCount = true;

    const res = await FT_API.get("/masterclass-categories", { params });
    const { items } = normalize<MasterclassCategory>(res.data, 1, 1000);
    return items;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load masterclass categories"
    );
  }
});

export const fetchMasterclassById = createAsyncThunk<
  MasterclassDetail,
  number | string,
  { rejectValue: string }
>("masterclass/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: MasterclassDetail;
    }>(`/masterclasses/${id}`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load masterclass"
    );
  }
});

const initialState: MasterclassState = {
  list: [],
  listLoading: false,
  listError: "",
  pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  sortBy: "id",
  sortOrder: "desc",
  categories: [],
  categoriesLoading: false,
  search: "",
  selectedCategoryId: null,
  current: null,
  currentLoading: false,
  currentError: "",
};

const slice = createSlice({
  name: "masterclass",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.pagination.page = 1;
    },
    setSelectedCategoryId: (state, action: PayloadAction<number | null>) => {
      state.selectedCategoryId = action.payload;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    setSort: (
      state,
      action: PayloadAction<{ sortBy: MasterclassSortBy; sortOrder: SortOrder }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterclasses.pending, (state) => {
        state.listLoading = true;
        state.listError = "";
      })
      .addCase(fetchMasterclasses.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload.items;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchMasterclasses.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || "Error";
      })
      .addCase(fetchMasterclassCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchMasterclassCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchMasterclassCategories.rejected, (state) => {
        state.categoriesLoading = false;
      })
      .addCase(fetchMasterclassById.pending, (state) => {
        state.currentLoading = true;
        state.currentError = "";
      })
      .addCase(fetchMasterclassById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchMasterclassById.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload || "Error";
      });
  },
});

export const masterclassActions = slice.actions;
export const masterclassReducer = slice.reducer;
// Backwards-compat aliases for the legacy store-config import names.
export const masterclassCategoryReducers = slice.reducer;
export const masterclassCategoryActions = slice.actions;
// Legacy thunk alias used by HomePage Slider — points to the new fetcher.
export const getMasterclassCategory = fetchMasterclassCategories;
