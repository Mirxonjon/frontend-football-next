"use client";

import { useDispatch, useSelector } from "react-redux";
import c from "./Aside.module.scss";
import cs from "classnames";
import {
  booksActions,
  getBookWithCategory,
} from "../../../store/books/booksSlice";
import { useLocalizedText } from "../../../hook/useLocalizedText";
const Aside = ({ title, list }: any) => {
  const dispatch = useDispatch<any>();
  const changaLang = useLocalizedText();

  const selectedCategoryId = useSelector(
    (state: any) => state.books.selected_category
  );

  return (
    <div className={c.wrapper}>
      <div className={c.title}>{title}</div>
      {list?.length &&
        list.map((i) => (
          <button 
            className={cs(c.item, selectedCategoryId === i.id ? c.active : "")}
            onClick={() => {
              dispatch(booksActions.setSelectedCategory(i.id));
              dispatch(getBookWithCategory());
            }}
            key={i.id}
          >
            {i[changaLang("title")]}
          </button>
        ))}
    </div>
  );
};

export default Aside;