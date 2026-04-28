"use client";

import { useNavigate, useParams } from "@/lib/router-compat";
import s from "./CopySinglePage.module.scss";
import Container from "../../components/ui/Container/Container";
import imgBook from "./../../assets/img/bookFrame.png";
import MyButton from "../../components/ui/MyButton/MyButton";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  getRecomendCopies,
  randomCopiesActions,
  singleCopy,
} from "../../store/copy/randomCopy";
import CardCopy from "../../components/ui/CardCopy/CardCopy";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";

const CopySinglePage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const RandomCopies = useSelector(
    (state: any) => state.randomCopies.recomendCopies
  );
  const changaLang = useLocalizedText();

  const copy = useSelector(
    (state: any) => state.randomCopies.singleCopy?.findShortBook
  );
  const isFollow =
    useSelector((state: any) => state.randomCopies.singleCopy?.follow) === "true"
      ? true
      : false;

  const { id } = useParams();
  const downloadFile = () => {
    if (isFollow) {
      const url =
        "https://storage.googleapis.com/telecom2003/" + copy.short_book_link;
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
    dispatch(singleCopy(id));
    if (RandomCopies?.length) {
      dispatch(randomCopiesActions.getRandomCopies());
    } else {
      dispatch(getRecomendCopies())
        .unwrap()
        .then((result) => {
          dispatch(randomCopiesActions.getRandomCopies(result));
        });
    }
  }, [id]);
  if (!copy) {
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
            <title> CoachingZona Konspektlar</title>
            <meta name="description" content="CoachingZona Konspektlar,Coaching Zona Konspektlar, CoachingZone Konspektlar  ,  Coaching Zone Konspektlar" />
            <link rel='canonical' href='https://coachingzona.uz/copies' />
          </Helmet>
      <div className={s.wrapper}>
        <div className={s.main}>
          <div className={s.row}>
            <div className={s.img}>
              <img
                src={
                  copy?.short_book_img
                    ? "https://storage.googleapis.com/telecom2003/" +
                      copy?.short_book_img
                    : (imgBook as any).src ?? imgBook
                }
                alt="copy"
              />
            </div>
            <div className={s.body}>
              <div className={s.name}>{copy[changaLang("title")]}</div>
              <div className={s.price}>
                {copy.book_lang == "ru"
                  ? content[changaLang("ru")]
                  : content[changaLang("uz")]}
              </div>
              <div className={s.info}>
                {!isFollow ? content[changaLang("info")] : ""}
              </div>
              <div className={s.btn}>
                <MyButton onClick={downloadFile}>
                  {" "}
                  {content[changaLang("btn")]}
                </MyButton>
              </div>
            </div>
          </div>
          <div className={s.descrip}>
            <h2 className={s.descripTitle}>{content[changaLang("title")]}</h2>
            <p>{copy[changaLang("description_book")]}</p>
          </div>
        </div>
        <aside className={s.aside}>
          <h2 className={s.titleRecomend}>{content[changaLang("recomend")]}</h2>
          <div className={s.list}>
            {RandomCopies?.length &&
              RandomCopies.map((copy) => (
                <CardCopy withOutBtn={true} key={copy.id} data={copy} />
              ))}
          </div>
        </aside>
      </div>
    </Container>
  );
};

export default CopySinglePage;