import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export const getTreningSubCatWithCateg = createAsyncThunk(
  "getTreningSubCatWithCateg",
  async (id: any, { rejectWithValue }) => {
    try {
      const response = await FT_API.get(`/trainingCategories/one/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getVideoWithCat = createAsyncThunk(
  "getVideoWithCat",
  async (id: any, { getState, rejectWithValue }) => {
    try {
      // console.log(id , 'sss');
      const state = getState() as any;
      console.log('11', state.IndividualTreningVideo);
      // const { subCategory } = state.IndividualTreningVideo;

      const response = await FT_API.get(
        `/IndividualtrainingCategories/one/${id}`
      );
      console.log(response.data ,'okkk');

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
const initialState: any = {
  treningSubCategory: [],
  selectedCategory: null,
  subCategory: null,
  loading: false,
  error: "",
  videos: [],
  loading_video: false,
  error_video: "",
  selected_video: null,
};

export const {
  actions: IndividualTreningVideoActions,
  reducer: IndividualTreningVideoReducers,
} = createSlice({
  name: "IndividualTreningVideo",
  initialState,
  extraReducers: (builder) => {
    builder
      // .addCase(getTreningSubCatWithCateg.pending, (state: any) => {
      //   state.loading = true;
      // })
      // .addCase(getTreningSubCatWithCateg.fulfilled, (state, action) => {
      //   state.loading = false;
      //   console.log(action.payload ,'aaa');
      //   if (action.payload.Training_sub_category?.length <= 0) {
      //     const { Training_sub_category, ...props } = action.payload;
      //     state.selectedCategory = { ...props };
      //     state.treningSubCategory = Training_sub_category;
      //     state.subCategory = Training_sub_category[0]?.id;
      //   }
      // })
      // .addCase(getTreningSubCatWithCateg.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = (action.payload as any) ?? "";
      // })
      .addCase(getVideoWithCat.pending, (state: any) => {
        state.loading_video = true;
      })
      .addCase(getVideoWithCat.fulfilled, (state, action) => {
        state.loading_video = false;
        state.videos = action.payload;
      })
      .addCase(getVideoWithCat.rejected, (state, action) => {
        state.loading_video = false;
        state.selected_video = action.payload as any;
        state.error_video = (action.payload as any) ?? "";
      });
  },
  reducers: {
    setSubCat: (state, action) => {
      state.subCategory = action.payload;
    },
    setSelectedVideo: (state, action) => {
      state.selected_video = action.payload as any;
    },
  },
});

