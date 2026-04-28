"use client";

import { Link, useParams } from "@/lib/router-compat";
import s from "./SaidbarCategories.module.scss";
import { useLocalizedText } from "../../../hook/useLocalizedText";
const SaidbarCategories = ({ title, list }: any) => {
  const { id } = useParams();

  const changaLang = useLocalizedText();
  return (
    <div className={s.wrapper}>
      <h4 className={s.title}>{title}</h4>
      <ul className={s.list}>
        {list.length &&
          list.map((el) => (
            <Link
              to={"/contests/" + el.id}
              key={el.id}
              className={el.id === id ? s.active : ""}
            >
              {el[changaLang("title")]}
            </Link>
          ))}
      </ul>
    </div>
  );
};

export default SaidbarCategories;