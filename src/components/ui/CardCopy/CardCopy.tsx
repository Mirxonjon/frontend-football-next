"use client";

import { Link } from "@/lib/router-compat";
import s from "./CardCopy.module.scss";
import imgBook from "./../../../assets/img/bookFrame.png";
import MyButton from "../MyButton/MyButton";
import { useLocalizedText } from "../../../hook/useLocalizedText";

const CardCopy = ({ data, withOutBtn }: any) => {
  const changaLang = useLocalizedText();

  const content = {
    view: "Ko`rish",
    view_ru: "Смотреть",
    ru: "Ruscha",
    ru_ru: "Русский",
    uz: "O`zbekcha",
    uz_ru: "Узбекский",
  };
  return (
    <Link to={"/copies/" + data.id} className={s.item}>
      <div className={s.img}>
        <img
          src={
            data?.short_book_img
              ? "https://storage.googleapis.com/telecom2003/" +
                data?.short_book_img
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

export default CardCopy;