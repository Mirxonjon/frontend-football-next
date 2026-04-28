import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

function getRandomElements(arr) {
  if (!Array.isArray(arr) || arr.length < 2) {
    
    return null;
  }

  const copyArr = [...arr];
  const randomElements = [
    copyArr.splice(Math.floor(Math.random() * copyArr.length), 1)[0],
  ];

  randomElements.push(
    copyArr.splice(Math.floor(Math.random() * copyArr.length), 1)[0]
  );

  return randomElements;
}

export const getRecomendBooks = createAsyncThunk(
  "getAllBooks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(
        `/Books/allWithPage?pageNumber=1&pageSize=100`
      );
      return response?.data.results;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const singleBook = createAsyncThunk(
  "singleBook",
  async (id: any, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/Books/one/` + id);
      return response?.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  allBooks: [],
  recomendBooks: [],
  loading: false,
  error: "",
  singleBook: null,
  loading_single: false,
  error_single: "",
};

export const { actions: randomBooksActions, reducer: randomBooksReducers } =
  createSlice({
    name: "randomBooks",
    initialState,
    extraReducers: (builder) => {
      builder
        .addCase(getRecomendBooks.pending, (state: any) => {
          state.loading = true;
        })
        .addCase(getRecomendBooks.fulfilled, (state, action) => {
          state.loading = false;
          state.allBooks = action.payload;
        })
        .addCase(getRecomendBooks.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as any) ?? "";
        })
        .addCase(singleBook.pending, (state: any) => {
          state.loading_single = true;
        })
        .addCase(singleBook.fulfilled, (state, action) => {
          state.loading_single = false;
          state.singleBook = action.payload;
        })
        .addCase(singleBook.rejected, (state, action) => {
          state.loading_single = false;
          state.error_single = (action.payload as any) ?? "";
        });
    },
    reducers: {
      getRandomBooks: (state: any, action: { payload?: any }) => {
        if (action.payload) {
          state.recomendBooks = getRandomElements(action.payload);
        } else {
          state.recomendBooks = getRandomElements(state.allBooks);
        }
      },
    },
  });

