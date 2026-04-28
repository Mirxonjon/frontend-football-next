import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getCopyAllCategory = createAsyncThunk(
  "getCopyAllCategory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/ShortBooksCategories/all`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getCopyWithCategory = createAsyncThunk(
  "getCopyWithCategory",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { currentPage, pageSize } = state.copies.pagination;
      const selectCategory = state.copies.selected_category;
      const { lang } = state.lang;
      const search = state.copies.search;
      let url = `/ShortBooks/allWithPage?pageNumber=${currentPage}&pageSize=${pageSize}`;
      if (search.length > 0) {
        url = `/ShortBooks/filter/${lang}?title=${search}&pageNumber=${currentPage}&pageSize=${pageSize}`;
      } else if (selectCategory !== null) {
        url = `/ShortBooks/withCategory/allWithPage/${selectCategory}?pageNumber=${currentPage}&pageSize=${pageSize}`;
      }
      const response = await FT_API.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  copyCategory: [],
  pagination: {
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  },
  loading: false,
  error: "",
  selected_category: null,
  selected_copy: {},
  copies: [],
  loading_copies: false,
  error_copies: "",
  search: "",
};

export const { actions: copiesActions, reducer: copiesReducers } = createSlice({
  name: "copies",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getCopyAllCategory.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getCopyAllCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.copyCategory = action.payload;
      })
      .addCase(getCopyAllCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any) ?? "";
      })
      .addCase(getCopyWithCategory.pending, (state: any) => {
        state.loading_copies = true;
      })
      .addCase(getCopyWithCategory.fulfilled, (state, action) => {
        state.loading_copies = false;
        state.copies = action.payload.results;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCopyWithCategory.rejected, (state, action) => {
        state.loading_copies = false;
        state.error_copies = (action.payload as any) ?? "";
      });
  },
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selected_category = action.payload;
      state.pagination.currentPage = 1;
      state.search = "";
    },
    setSelectedCopy: (state, action) => {
      state.selected_copy = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
  },
});

