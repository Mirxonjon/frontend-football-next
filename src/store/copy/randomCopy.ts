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

export const getRecomendCopies = createAsyncThunk(
  "getAllCopies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/ShortBooks/all`);
      return response?.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const singleCopy = createAsyncThunk(
  "singleCopy",
  async (id: any, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`ShortBooks/one/` + id);
      return response?.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState: any = {
  allCopies: [],
  recomendCopies: [],
  loading: false,
  error: "",
  singleCopy: null,
  loading_single: false,
  error_single: "",
};

export const { actions: randomCopiesActions, reducer: randomCopiesReducers } =
  createSlice({
    name: "randomCopies",
    initialState,
    extraReducers: (builder) => {
      builder
        .addCase(getRecomendCopies.pending, (state: any) => {
          state.loading = true;
        })
        .addCase(getRecomendCopies.fulfilled, (state, action) => {
          state.loading = false;
          state.allCopies = action.payload;
        })
        .addCase(getRecomendCopies.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as any) ?? "";
        })
        .addCase(singleCopy.pending, (state: any) => {
          state.loading_single = true;
        })
        .addCase(singleCopy.fulfilled, (state, action) => {
          state.loading_single = false;
          state.singleCopy = action.payload;
        })
        .addCase(singleCopy.rejected, (state, action) => {
          state.loading_single = false;
          state.error_single = (action.payload as any) ?? "";
        });
    },
    reducers: {
      getRandomCopies: (state: any, action: { payload?: any }) => {
        if (action.payload) {
          state.recomendCopies = getRandomElements(action.payload);
        } else {
          state.recomendCopies = getRandomElements(state.allCopies);
        }
      },
    },
  });
