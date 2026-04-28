"use client";

import s from "./BookList.module.scss";
import Card from "../Card/Card";
import Search from "../Search/Search";
import Pagination from "../Pagination/Pagination";
import { useDispatch, useSelector } from "react-redux";
import {
  booksActions,
  getBookWithCategory,
} from "../../../store/books/booksSlice";
import { Select } from "antd";
import NotFound from "../404/404";
import { useLocalizedText } from "../../../hook/useLocalizedText";
const BookList = ({ title, list, data, windowWidth }: any) => {
  const dispatch = useDispatch<any>();
  const pagination = useSelector((state: any) => state.books.pagination);
  const loading_books = useSelector((state: any) => state.books.loading_books);
  const search = useSelector((state: any) => state.books.search);
  const changaLang = useLocalizedText();

  const handleSelect = (value) => {
    dispatch(booksActions.setSelectedCategory(value));
    dispatch(getBookWithCategory());
  };

  function setPaginationParams(paginationParams) {
    dispatch(booksActions.setPagination(paginationParams));
    dispatch(getBookWithCategory());
  }

  const content = {
    error: "Bu categoriya uchun kitob topilmadi",
    error_ru: "Для этой категории книги не найдено",
  };
  return (
    <div className={s.wrapper}>
      <div className={s.row}>
        <div className={s.title}>{title}</div>
        {list.length > 0 && windowWidth <= 990 && (
          <div className={s.select}>
            <Select 
              className={s.select}
              defaultValue={list[0].id}
              onChange={handleSelect}
              options={list.map((el) => ({
                value: el.id,
                label: el[changaLang("title")] ,
              }))}
            />
          </div>
        )}
        <Search
          value={search}
          onChange={(e) => {
            dispatch(booksActions.setSearch(e.target.value));
            dispatch(getBookWithCategory());
          }}
        />
      </div>

      <div className={s.list}>
        {loading_books ? (
          <h2>Loading ...</h2>
        ) : data?.length > 0 ? (
          data.map((el) => <Card key={el.id} data={el} />)
        ) : (
          <NotFound
            subTitle={content[changaLang("error")]}
            style={{ height: 300 }}
          />
        )}
      </div>

      {data?.length > 0 && (
        <Pagination
          paginationParams={pagination}
          setPaginationParams={setPaginationParams}
        />
      )}
    </div>
  );
};

export default BookList;