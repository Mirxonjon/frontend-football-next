import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type LessonBlockType =
  | "TITLE"
  | "TEXT"
  | "VIDEO"
  | "IMAGE"
  | "FILE"
  | "HINT";

export type LessonBlock = {
  id: number;
  lessonId: number;
  blockType: LessonBlockType;
  sequenceOrder: number;
  duration: number | null;
  isFree: boolean;
  isLocked: boolean;
  contentUz: string | null;
  contentRu: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Lesson = {
  id: number;
  trainingCategoryId: number;
  titleUz: string;
  titleRu: string;
  isFree: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  trainingCategory?: {
    id: number;
    titleUz: string;
    titleRu: string;
    ageCategoriesId: number;
    ageCategory?: {
      id: number;
      titleUz: string;
      titleRu: string;
      minAge: number;
      maxAge: number;
    };
  };
  lessonBlocks?: LessonBlock[];
};

export type LessonsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LessonSortBy = "id" | "createdAt";
export type SortOrder = "asc" | "desc";
export type ProgressStatus = "not_started" | "in_progress" | "completed";

type LessonsState = {
  list: Lesson[];
  listLoading: boolean;
  listError: string;
  pagination: LessonsPagination;
  sortBy: LessonSortBy;
  sortOrder: SortOrder;
  progressStatus: ProgressStatus | null;
  hasVideo: boolean;
  current: Lesson | null;
  currentLoading: boolean;
  currentError: string;
};

type FetchLessonsArgs = {
  page?: number;
  limit?: number;
  all?: boolean;
  trainingCategoryId?: number;
  ageCategoryId?: number;
  search?: string;
  isFree?: boolean;
  unlocked?: boolean;
  sortBy?: LessonSortBy;
  sortOrder?: SortOrder;
  progressStatus?: ProgressStatus | null;
  hasVideo?: boolean;
};

type FetchListResult = {
  items: Lesson[];
  pagination: LessonsPagination | null;
};

const normalize = (
  raw: any,
  fallbackPage: number,
  fallbackLimit: number
): FetchListResult => {
  let items: Lesson[] = [];
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

export const fetchLessons = createAsyncThunk<
  FetchListResult,
  FetchLessonsArgs,
  { state: any; rejectValue: string }
>("lessons/fetchList", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState().lessons as LessonsState;
    const page = args.page ?? state.pagination.page;
    const limit = args.limit ?? state.pagination.limit;

    const params: Record<string, any> = {};
    if (args.all) {
      params.all = true;
    } else {
      params.page = page;
      params.limit = limit;
    }
    if (args.trainingCategoryId != null)
      params.trainingCategoryId = args.trainingCategoryId;
    if (args.ageCategoryId != null) params.ageCategoryId = args.ageCategoryId;
    if (args.search) params.search = args.search;
    if (args.isFree) params.isFree = true;
    if (args.unlocked) params.unlocked = true;
    if (args.hasVideo) params.hasVideo = true;

    const sortBy = args.sortBy ?? state.sortBy;
    const sortOrder = args.sortOrder ?? state.sortOrder;
    const progressStatus =
      args.progressStatus !== undefined
        ? args.progressStatus
        : state.progressStatus;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (progressStatus) params.progressStatus = progressStatus;

    const res = await FT_API.get("/lessons", { params });
    return normalize(res.data, page, limit);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to load lessons"
    );
  }
});

export const fetchLessonById = createAsyncThunk<
  Lesson,
  number | string,
  { rejectValue: string }
>("lessons/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{ status_code: number; data: Lesson }>(
      `/lessons/${id}`
    );
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || err?.message || "Failed to load lesson"
    );
  }
});

const initialState: LessonsState = {
  list: [],
  listLoading: false,
  listError: "",
  pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  sortBy: "id",
  sortOrder: "desc",
  progressStatus: null,
  hasVideo: false,
  current: null,
  currentLoading: false,
  currentError: "",
};

const slice = createSlice({
  name: "lessons",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    resetPage: (state) => {
      state.pagination.page = 1;
    },
    setSort: (
      state,
      action: PayloadAction<{ sortBy: LessonSortBy; sortOrder: SortOrder }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.pagination.page = 1;
    },
    setProgressStatus: (
      state,
      action: PayloadAction<ProgressStatus | null>
    ) => {
      state.progressStatus = action.payload;
      state.pagination.page = 1;
    },
    setHasVideo: (state, action: PayloadAction<boolean>) => {
      state.hasVideo = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLessons.pending, (state) => {
        state.listLoading = true;
        state.listError = "";
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload.items;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || "Error";
      })
      .addCase(fetchLessonById.pending, (state) => {
        state.currentLoading = true;
        state.currentError = "";
        // Keep `current` in place during refetch so embedded VideoPlayer
        // doesn't unmount and reset its retry guard, causing an infinite loop.
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchLessonById.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload || "Error";
      });
  },
});

export const lessonsActions = slice.actions;
export const lessonsReducer = slice.reducer;
