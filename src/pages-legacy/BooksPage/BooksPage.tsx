"use client";

import { useEffect, useState } from "react";
import Aside from "../../components/ui/Aside/Aside";
import BookList from "../../components/ui/BookList/BookList";
import Container from "../../components/ui/Container/Container";
import s from "./BooksPage.module.scss";
import { useDispatch, useSelector } from "react-redux";
import {
  getBookAllCategory,
  getBookWithCategory,
} from "../../store/books/booksSlice";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";

const BooksPage = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const dispatch = useDispatch<any>();
  const changaLang = useLocalizedText();

  const bookCategory = useSelector((state: any) => state.books.bookCategory);
  const books = useSelector((state: any) => state.books.books);

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    dispatch(getBookWithCategory());
    dispatch(getBookAllCategory());
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const content = {
    title: "Kitoblar",
    title_ru: "Книги",
    category: "Kategoriyalar",
    category_ru: "Категории",
  };
  return (
    <Container>
      <Helmet>
        <title>CoachingZona Kitoblar</title>
        <meta name="description" content="CoachingZona Kitoblari ,Coaching Zona Kitoblari , Murabbiylar kitoblari , Futbol haqida kitob " />
        <link rel='canonical' href='https://coachingzona.uz/books' />
      </Helmet>
      <div className={s.wrapper}>
        {bookCategory.length
          ? windowWidth > 990 && (
              <Aside
                list={bookCategory}
                title={content[changaLang("category")]}
              />
            )
          : ""}
        <BookList
          windowWidth={windowWidth}
          list={bookCategory}
          data={books}
          title={content[changaLang("title")]}
        />
      </div>
    </Container>
  );
};

export default BooksPage;