import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getTreningCategory = createAsyncThunk(
  "getTreningCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.treningCategory.pagination;
      const response = await FT_API.get(
        `/trainingCategories/allWithPage?pageNumber=${currentPage}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getTreningCategoryWithAge = createAsyncThunk(
  "getTreningCategoryWithAge",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.treningCategory.pagination;
      const { age } = state.treningCategory;
      const response = await FT_API.get(
        `/trainingCategories/filter?${
          age ? "age=" + age + "&" : ""
        }pageNumber=${currentPage}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  treningCategory: [],
  pagination: {
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  },
  age: null,
  loading: false,
  error: "",
};

export const {
  actions: treningCategoryActions,
  reducer: treningCategoryReducers,
} = createSlice({
  name: "treningCategory",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getTreningCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getTreningCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.treningCategory = action.payload.results; // Перезаписываем массив тренеров, так как, вероятно, это полный список
        state.pagination = action.payload.pagination; // Перезаписываем массив тренеров, так как, вероятно, это полный список
      })
      .addCase(getTreningCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      })
      .addCase(getTreningCategoryWithAge.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getTreningCategoryWithAge.fulfilled, (state, action) => {
        state.loading = false;
        state.treningCategory = action.payload.results; // Перезаписываем массив тренеров, так как, вероятно, это полный список
        state.pagination = action.payload.pagination;
      })
      .addCase(getTreningCategoryWithAge.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      });
  },
  reducers: {
    setAge: (state, action) => {
      state.age = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
  },
});

