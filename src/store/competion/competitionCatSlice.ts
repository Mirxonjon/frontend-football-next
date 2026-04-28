import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getCompetitionCategory = createAsyncThunk(
  "getCompetitionCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.competition.pagination;
      const response = await FT_API.get(
        `/competitionCategories/allWithPage?pageNumber=${currentPage}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getCompetitionAllCategory = createAsyncThunk(
  "getCompetitionAllCategory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/competitionCategories/all`);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getCompetitionVideos = createAsyncThunk(
  "getCompetitionVideos",
  async (categoryId: any, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(
        `/competitionCategories/one/${categoryId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  competitionCategory: [],
  competitionAllCategory: [],
  pagination: {
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  },
  loading: false,
  error: "",
  competitionVideos: {},
  loading_videos: false,
  error_videos: "",
};

export const {
  actions: competitionCategoryActions,
  reducer: competitionCategoryReducers,
} = createSlice({
  name: "competition",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getCompetitionCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getCompetitionCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.competitionCategory = action.payload.results;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCompetitionCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      })
      .addCase(getCompetitionVideos.pending, (state: any) => {
        state.loading_videos = true;
      })
      .addCase(getCompetitionVideos.fulfilled, (state, action) => {
        state.loading_videos = false;
        state.competitionVideos = action.payload;
      })
      .addCase(getCompetitionVideos.rejected, (state, action) => {
        state.loading_videos = false;
        state.error_videos = (action.payload as any) ?? "";
      })
      .addCase(getCompetitionAllCategory.pending, (state: any) => {
        state.loading_all_cat = true;
      })
      .addCase(getCompetitionAllCategory.fulfilled, (state, action) => {
        state.loading_all_cat = false;
        state.competitionAllCategory = action.payload;
      })
      .addCase(getCompetitionAllCategory.rejected, (state, action) => {
        state.loading_all_cat = false;
        state.error_all_cat = (action.payload as any) ?? "";
      });
  },
  reducers: {
    setSelectedVideo: (state, action) => {
      state.selected_video = action.payload as any;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
  },
});

