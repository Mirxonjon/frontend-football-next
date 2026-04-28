import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getIndIvidualTreningCategory = createAsyncThunk(
  "getIndIvidualTreningCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.treningCategory.pagination;
      const response = await FT_API.get(
        `/IndividualtrainingCategories/allWithPage?pageNumber=${currentPage}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getIndividualTreningCategoryWithCategory = createAsyncThunk(
  "getIndividualTreningCategoryWithCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.individualTreningCategory.pagination;
      const { age } = state.individualTreningCategory;
      const response = await FT_API.get(
        `IndividualtrainingCategories/filter?${
          age ? "individualCategory=" + age + "&" : ""
        }pageNumber=${currentPage}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  individualtreningCategorys: [],
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
  actions: individualtreningCategoryActions,
  reducer: individualtreningCategoryReducers,
} = createSlice({
  name: "individualTreningCategory",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getIndIvidualTreningCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getIndIvidualTreningCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.individualtreningCategorys = action.payload.results; // Перезаписываем массив тренеров, так как, вероятно, это полный список
        state.pagination = action.payload.pagination; // Перезаписываем массив тренеров, так как, вероятно, это полный список
      })
      .addCase(getIndIvidualTreningCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      })
      .addCase(getIndividualTreningCategoryWithCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getIndividualTreningCategoryWithCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.individualtreningCategorys = action.payload.results; // Перезаписываем массив тренеров, так как, вероятно, это полный список
        state.pagination = action.payload.pagination;
      })
      .addCase(getIndividualTreningCategoryWithCategory.rejected, (state, action) => {
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

