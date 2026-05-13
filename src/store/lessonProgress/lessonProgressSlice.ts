import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type LessonProgress = {
  id?: number;
  userId: number;
  lessonId: number;
  lastBlockSequence: number;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  lesson?: {
    id: number;
    titleUz: string;
    titleRu: string;
    trainingCategoryId: number;
  };
};

type State = {
  // List for "Continue watching".
  list: LessonProgress[];
  listLoading: boolean;
  listError: string;
  // Per-lesson cache so the player can resume / mark blocks done quickly.
  byLesson: Record<number, LessonProgress>;
  byLessonLoading: Record<number, boolean>;
  // Mutation guard so we don't spam the network.
  updating: Record<number, boolean>;
};

const initialState: State = {
  list: [],
  listLoading: false,
  listError: "",
  byLesson: {},
  byLessonLoading: {},
  updating: {},
};

export const fetchMyProgressList = createAsyncThunk<
  LessonProgress[],
  void,
  { rejectValue: string }
>("lessonProgress/listMine", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: LessonProgress[];
    }>("/me/lessons/progress");
    return res.data?.data ?? [];
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load progress"
    );
  }
});

export const fetchLessonProgress = createAsyncThunk<
  LessonProgress,
  number,
  { rejectValue: string }
>("lessonProgress/getMine", async (lessonId, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: LessonProgress;
    }>(`/me/lessons/${lessonId}/progress`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load lesson progress"
    );
  }
});

export const updateLessonProgress = createAsyncThunk<
  LessonProgress,
  { lessonId: number; lastBlockSequence: number },
  { rejectValue: { status: number | null; message: string } }
>(
  "lessonProgress/update",
  async ({ lessonId, lastBlockSequence }, { rejectWithValue }) => {
    try {
      const res = await FT_API.patch<{
        status_code: number;
        data: LessonProgress;
      }>(`/me/lessons/${lessonId}/progress`, { lastBlockSequence });
      return res.data.data;
    } catch (err: any) {
      const status = err?.response?.status ?? null;
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update progress";
      // Surface in DevTools so we can see why the server rejected it
      // (most common cause: 403 — subscription required).
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn(
          `[lessonProgress] PATCH /me/lessons/${lessonId}/progress failed`,
          { status, message }
        );
      }
      return rejectWithValue({ status, message });
    }
  }
);

const slice = createSlice({
  name: "lessonProgress",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    // ── list ──
    b.addCase(fetchMyProgressList.pending, (s) => {
      s.listLoading = true;
      s.listError = "";
    });
    b.addCase(fetchMyProgressList.fulfilled, (s, a) => {
      s.listLoading = false;
      s.list = a.payload;
      // Seed the per-lesson cache so subsequent player loads paint instantly.
      for (const p of a.payload) s.byLesson[p.lessonId] = p;
    });
    b.addCase(fetchMyProgressList.rejected, (s, a) => {
      s.listLoading = false;
      s.listError = a.payload || "Failed to load progress";
    });

    // ── single ──
    b.addCase(fetchLessonProgress.pending, (s, a) => {
      s.byLessonLoading[a.meta.arg] = true;
    });
    b.addCase(fetchLessonProgress.fulfilled, (s, a) => {
      s.byLessonLoading[a.payload.lessonId] = false;
      s.byLesson[a.payload.lessonId] = a.payload;
    });
    b.addCase(fetchLessonProgress.rejected, (s, a) => {
      s.byLessonLoading[a.meta.arg] = false;
    });

    // ── update ──
    b.addCase(updateLessonProgress.pending, (s, a) => {
      s.updating[a.meta.arg.lessonId] = true;
    });
    b.addCase(updateLessonProgress.fulfilled, (s, a) => {
      s.updating[a.payload.lessonId] = false;
      s.byLesson[a.payload.lessonId] = a.payload;
      // Keep the "Continue" list in sync without a refetch.
      const idx = s.list.findIndex((p) => p.lessonId === a.payload.lessonId);
      if (idx >= 0) {
        s.list[idx] = { ...s.list[idx], ...a.payload };
      }
    });
    b.addCase(updateLessonProgress.rejected, (s, a) => {
      s.updating[a.meta.arg.lessonId] = false;
      // The error payload is exposed via the action so UI components can
      // listen for it (e.g., to show a toast about missing subscription).
    });
  },
});

export const lessonProgressReducer = slice.reducer;

// ─── helpers ────────────────────────────────────────────────────────

/** True when this lesson is in progress but not finished yet. */
export const isInProgress = (p: LessonProgress | undefined): boolean =>
  Boolean(p) && !p!.isCompleted && p!.lastBlockSequence > 0;

/** Coarse percent for a Progress bar (0–100). */
export const progressPercent = (
  p: LessonProgress | undefined,
  totalBlocks: number
): number => {
  if (!p || totalBlocks <= 0) return 0;
  if (p.isCompleted) return 100;
  return Math.min(
    100,
    Math.round((p.lastBlockSequence / totalBlocks) * 100)
  );
};
