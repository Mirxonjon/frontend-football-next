import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getMasterclassCategory = createAsyncThunk(
  "getMasterclassCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.masterclass.pagination;
      const response = await FT_API.get(
        `/MasterclassCategory/allWithPage?pageNumber=${currentPage}&pageSize=${pageSize}`
        );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getMasterclassAllCategory = createAsyncThunk(
  "getMasterclassAllCategory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/MasterclassCategory/all`);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getMasterclassVideos = createAsyncThunk(
  "getMasterclassVideos",
  async (categoryId: any, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(
        `/MasterclassCategory/one/${categoryId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  masterclassCategory: [],
  masterclassAllCategory: [],
  pagination: {
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  },
  loading: false,
  error: "",
  masterclassVideos: {},
  loading_videos: false,
  error_videos: "",
};

export const {
  actions: masterclassCategoryActions,
  reducer: masterclassCategoryReducers,
} = createSlice({
  name: "masterclass",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getMasterclassCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getMasterclassCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.masterclassCategory = action.payload.results;
        state.pagination = action.payload.pagination;
      })
      .addCase(getMasterclassCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      })
      .addCase(getMasterclassVideos.pending, (state: any) => {
        state.loading_videos = true;
      })
      .addCase(getMasterclassVideos.fulfilled, (state, action) => {
        state.loading_videos = false;
        state.masterclassVideos = action.payload;
      })
      .addCase(getMasterclassVideos.rejected, (state, action) => {
        state.loading_videos = false;
        state.error_videos = (action.payload as any) ?? "";
      })
      .addCase(getMasterclassAllCategory.pending, (state: any) => {
        state.loading_all_cat = true;
      })
      .addCase(getMasterclassAllCategory.fulfilled, (state, action) => {
        state.loading_all_cat = false;
        state.masterclassAllCategory = action.payload;
      })
      .addCase(getMasterclassAllCategory.rejected, (state, action) => {
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

