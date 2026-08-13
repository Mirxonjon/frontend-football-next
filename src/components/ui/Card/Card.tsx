"use client";

import { Link } from "@/lib/router-compat";
import s from "./Card.module.scss";
import imgBook from "./../../../assets/img/bookFrame.png";
import MyButton from "../MyButton/MyButton";
import { useLocalizedText } from "../../../hook/useLocalizedText";

const Card = ({ data, withOutBtn }: { data?: any; withOutBtn?: any }) => {
  const changaLang = useLocalizedText();

  const content = {
    view: "Koʻrish",
    view_ru: "Смотреть",
    ru: "Ruscha",
    ru_ru: "Русский",
    uz: "Oʻzbekcha",
    uz_ru: "Узбекский",
  };
  return (
    <Link to={"/books/" + data.id} className={s.item}>
      <div className={s.img}>
        <img
          src={
            data?.book_img
              ? "https://storage.googleapis.com/telecom2003/" + data?.book_img
              : (imgBook as any).src ?? imgBook
          }
          alt={"book"}
        />
      </div>
      <div className={s.name}>{data[changaLang("title")]}</div>
      <div className={s.price}>
        {data.book_lang == "ru"
          ? content[changaLang("ru")]
          : content[changaLang("uz")]}
      </div>
      {!withOutBtn && <MyButton>{content[changaLang("view")]}</MyButton>}
    </Link>
  );
};

export default Card;