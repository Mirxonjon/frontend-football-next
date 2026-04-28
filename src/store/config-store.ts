import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { langReducers } from "./slice/lang";
import { treningCategoryReducers } from "./trening/treningCategoriesSlice";
import { treningSubCategoryReducers } from "./trening/treningSubCatSlice";
import { competitionCategoryReducers } from "./competion/competitionCatSlice";
import { booksReducers } from "./books/booksSlice";
import { randomBooksReducers } from "./books/randomBook";
import { copiesReducers } from "./copy/copiesSlice";
import { randomCopiesReducers } from "./copy/randomCopy";
import { masterclassCategoryReducers } from "./masterclass/masterclassSlice";
import { individualtreningCategoryReducers } from "./individualTraining/IndividualTreningCategoriesSlice";
import { IndividualTreningVideoReducers } from "./individualTraining/IndividualTreningVideo";

export const makeStore = () =>
  configureStore({
    reducer: {
      lang: langReducers,
      treningCategory: treningCategoryReducers,
      individualTreningCategory: individualtreningCategoryReducers,
      IndividualTreningVideo: IndividualTreningVideoReducers,
      competition: competitionCategoryReducers,
      treningSubCategory: treningSubCategoryReducers,
      books: booksReducers,
      copies: copiesReducers,
      randomBooks: randomBooksReducers,
      randomCopies: randomCopiesReducers,
      masterclass: masterclassCategoryReducers,
    },
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
