"use client";

import { useNavigate, useParams } from "@/lib/router-compat";
import s from "./BookSinglePage.module.scss";
import Card from "../../components/ui/Card/Card";
import Container from "../../components/ui/Container/Container";
import imgBook from "./../../assets/img/bookFrame.png";
import MyButton from "../../components/ui/MyButton/MyButton";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  getRecomendBooks,
  randomBooksActions,
  singleBook,
} from "../../store/books/randomBook";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { message } from "antd";
import { Helmet } from "@/lib/helmet-compat";
const BookSinglePage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const changaLang = useLocalizedText();

  const [messageApi, contextHolder] = message.useMessage();
  const RandomBooks = useSelector((state: any) => state.randomBooks.recomendBooks);
  const book = useSelector((state: any) => state.randomBooks.singleBook?.findBook);
  const isFollow =
    useSelector((state: any) => state.randomBooks.singleBook?.follow) === "true"
      ? true
      : false;

  const { id } = useParams();
  const downloadFile = () => {
    if (isFollow) {
      const url =
        "https://storage.googleapis.com/telecom2003/" + book.book_link;
      const link = document.createElement("a");
      link.href = url;
      link.download = "your_file_name.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      navigate("/login");
    }
  };
  useEffect(() => {
    dispatch(singleBook(id));
    if (RandomBooks?.length) {
      dispatch(randomBooksActions.getRandomBooks());
    } else {
      dispatch(getRecomendBooks())
        .unwrap()
        .then((result) => {
          dispatch(randomBooksActions.getRandomBooks(result));
        })
        .catch((error) => {
          messageApi.info(error.message);
        });
    }
  }, [id]);
  if (!book) {
    return (
      <h2 style={{ textAlign: "center", fontSize: 22, marginTop: 50 }}>
        Loading ...
      </h2>
    );
  }

  const content = {
    view: "Ko`rish",
    view_ru: "Смотреть",
    ru: "Ruscha",
    ru_ru: "Русский",
    uz: "O`zbekcha",
    uz_ru: "Узбекский",
    info: "Yuklab olish uchun tizimga kirishiz kerak",
    info_ru: "Вы должны войти в систему, чтобы скачать",
    btn: "Yuklab olish",
    btn_ru: "Скачать",
    title: "Mahsulot tavsifi",
    title_ru: "Описание продукта",
    recomend: "Tavsiya etamiz",
    recomend_ru: "Рекомендуем",
  };
  return (
    <Container>
            <Helmet>
        <title>CoachingZona Kitob</title>
        <meta name="description" content="CoachingZona Kitoblari ,Coaching Zona Kitoblari , Murabbiylar kitoblari , Futbol haqida kitob " />
        <link rel='canonical' href='https://coachingzona.uz/books' />
      </Helmet>
      <div className={s.wrapper}>
        <div className={s.main}>
          <div className={s.row}>
            {contextHolder}
            <div className={s.img}>
              <img
                src={
                  book?.book_img
                    ? "https://storage.googleapis.com/telecom2003/" +
                      book?.book_img
                    : (imgBook as any).src ?? imgBook
                }
                alt="book"
              />
            </div>
            <div className={s.body}>
              <div className={s.name}>{book[changaLang("title")]}</div>
              <div className={s.price}>
                {book.book_lang == "ru"
                  ? content[changaLang("ru")]
                  : content[changaLang("uz")]}
              </div>
              <div className={s.info}>
                {!isFollow ? content[changaLang("info")] : ""}
              </div>
              <div className={s.btn}>
                <MyButton onClick={downloadFile}>
                  {content[changaLang("btn")]}
                </MyButton>
              </div>
            </div>
          </div>
          <div className={s.descrip}>
            <h2 className={s.descripTitle}>{content[changaLang("title")]}</h2>
            <p>{book[changaLang("description_book")]}</p>
          </div>
        </div>
        <aside className={s.aside}>
          <h2 className={s.titleRecomend}>{content[changaLang("recomend")]}</h2>
          <div className={s.list}>
            {RandomBooks?.length &&
              RandomBooks.map((book) => (
                <Card withOutBtn={true} key={book.id} data={book} />
              ))}
          </div>
        </aside>
      </div>
    </Container>
  );
};

export default BookSinglePage;