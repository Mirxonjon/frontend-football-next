import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type AgeCategory = {
  id: number;
  titleUz: string;
  titleRu: string;
  minAge: number;
  maxAge: number;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainingCategory = {
  id: number;
  titleUz: string;
  titleRu: string;
  ageCategoriesId: number;
  descriptionUz: string;
  descriptionRu: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  ageCategory: AgeCategory;
  lessonCount?: number;
};

export type CategorySortBy = "id" | "createdAt" | "lessonCount";
export type SortOrder = "asc" | "desc";
export type CategoryProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type TrainingViewMode = "categories" | "lessons";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type TrainingCategoryState = {
  items: TrainingCategory[];
  loading: boolean;
  error: string;
  selectedAgeId: number | null;
  search: string;
  viewMode: TrainingViewMode;
  freeOnly: boolean;
  unlockedOnly: boolean;
  selectedCategoryId: number | null;
  pagination: Pagination;
  sortBy: CategorySortBy;
  sortOrder: SortOrder;
  hasLessons: boolean;
  progressStatus: CategoryProgressStatus | null;
  ageCategoryOptions: AgeCategory[];
  ageOptionsLoaded: boolean;
  current: TrainingCategory | null;
  currentLoading: boolean;
  currentError: string;
};

type FetchArgs = {
  page?: number;
  limit?: number;
  all?: boolean;
  ageCategoryId?: number | null;
  search?: string;
  sortBy?: CategorySortBy;
  sortOrder?: SortOrder;
  hasLessons?: boolean;
  includeCount?: boolean;
  progressStatus?: CategoryProgressStatus | null;
};

type FetchResult = {
  items: TrainingCategory[];
  pagination: Pagination | null;
};

// Accepts either:
//   { data: TrainingCategory[] }                                — flat (all=true or legacy)
//   { data: TrainingCategory[], meta: { page, limit, total, totalPages } }
//   { data: { items: TrainingCategory[], meta: {...} } }
const normalize = (
  raw: any,
  fallbackPage: number,
  fallbackLimit: number
): FetchResult => {
  let items: TrainingCategory[] = [];
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

  return {
    items,
    pagination: {
      page: Number(meta.page ?? meta.currentPage ?? fallbackPage),
      limit: Number(meta.limit ?? meta.pageSize ?? fallbackLimit),
      total: Number(meta.total ?? meta.totalItems ?? items.length),
      totalPages: Number(
        meta.totalPages ??
          Math.max(
            1,
            Math.ceil(
              Number(meta.total ?? meta.totalItems ?? items.length) /
                Number(meta.limit ?? meta.pageSize ?? fallbackLimit)
            )
          )
      ),
    },
  };
};

export const fetchTrainingCategories = createAsyncThunk<
  FetchResult,
  FetchArgs | undefined,
  { state: any; rejectValue: string }
>("trainingCategories/fetch", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState().treningCategory as TrainingCategoryState;
    const page = args?.page ?? state.pagination.page;
    const limit = args?.limit ?? state.pagination.limit;
    const ageCategoryId =
      args?.ageCategoryId !== undefined
        ? args.ageCategoryId
        : state.selectedAgeId;
    const search = args?.search !== undefined ? args.search : state.search;
    const all = args?.all ?? false;
    const sortBy = args?.sortBy ?? state.sortBy;
    const sortOrder = args?.sortOrder ?? state.sortOrder;
    const hasLessons = args?.hasLessons ?? state.hasLessons;
    const includeCount = args?.includeCount ?? true;

    const params: Record<string, any> = {};
    if (all) {
      params.all = true;
    } else {
      params.page = page;
      params.limit = limit;
    }
    if (ageCategoryId != null) params.ageCategoryId = ageCategoryId;
    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (hasLessons) params.hasLessons = true;
    if (includeCount) params.includeCount = true;
    const progressStatus =
      args?.progressStatus !== undefined
        ? args.progressStatus
        : state.progressStatus;
    if (progressStatus) params.progressStatus = progressStatus;

    const res = await FT_API.get("/training-categories", { params });
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[training-categories] params:", params, "raw:", res.data);
    }
    return normalize(res.data, page, limit);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load training categories"
    );
  }
});

export const seedAgeCategoryOptions = createAsyncThunk<
  AgeCategory[],
  void,
  { rejectValue: string }
>("trainingCategories/seedAges", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get("/training-categories", {
      params: { all: true },
    });
    const { items } = normalize(res.data, 1, 1000);
    const map = new Map<number, AgeCategory>();
    items.forEach((it) => {
      if (it.ageCategory && !map.has(it.ageCategory.id)) {
        map.set(it.ageCategory.id, it.ageCategory);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.minAge - b.minAge);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to seed ages"
    );
  }
});

export const fetchTrainingCategoryById = createAsyncThunk<
  TrainingCategory,
  number | string,
  { rejectValue: string }
>("trainingCategories/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{ status_code: number; data: TrainingCategory }>(
      `/training-categories/${id}`
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to load category"
    );
  }
});

const initialState: TrainingCategoryState = {
  items: [],
  loading: false,
  error: "",
  selectedAgeId: null,
  search: "",
  viewMode: "categories",
  freeOnly: false,
  unlockedOnly: false,
  selectedCategoryId: null,
  pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
  sortBy: "id",
  sortOrder: "desc",
  hasLessons: false,
  progressStatus: null,
  ageCategoryOptions: [],
  ageOptionsLoaded: false,
  current: null,
  currentLoading: false,
  currentError: "",
};

const slice = createSlice({
  name: "treningCategory",
  initialState,
  reducers: {
    setSelectedAge: (state, action: PayloadAction<number | null>) => {
      state.selectedAgeId = action.payload;
      state.pagination.page = 1;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.pagination.page = 1;
    },
    setViewMode: (state, action: PayloadAction<TrainingViewMode>) => {
      state.viewMode = action.payload;
    },
    setFreeOnly: (state, action: PayloadAction<boolean>) => {
      state.freeOnly = action.payload;
    },
    setUnlockedOnly: (state, action: PayloadAction<boolean>) => {
      state.unlockedOnly = action.payload;
    },
    setSelectedCategoryId: (state, action: PayloadAction<number | null>) => {
      state.selectedCategoryId = action.payload;
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
      action: PayloadAction<{ sortBy: CategorySortBy; sortOrder: SortOrder }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.pagination.page = 1;
    },
    setHasLessons: (state, action: PayloadAction<boolean>) => {
      state.hasLessons = action.payload;
      state.pagination.page = 1;
    },
    setCategoryProgressStatus: (
      state,
      action: PayloadAction<CategoryProgressStatus | null>
    ) => {
      state.progressStatus = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrainingCategories.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchTrainingCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchTrainingCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      })
      .addCase(seedAgeCategoryOptions.fulfilled, (state, action) => {
        state.ageCategoryOptions = action.payload;
        state.ageOptionsLoaded = true;
      })
      .addCase(fetchTrainingCategoryById.pending, (state) => {
        state.currentLoading = true;
        state.currentError = "";
        state.current = null;
      })
      .addCase(fetchTrainingCategoryById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchTrainingCategoryById.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload || "Error";
      });
  },
});

export const treningCategoryActions = slice.actions;
export const treningCategoryReducers = slice.reducer;
