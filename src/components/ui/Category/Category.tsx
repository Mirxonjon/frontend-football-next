"use client";

import s from "./Category.module.scss";
import cs from "classnames";
import { Link } from "@/lib/router-compat";
import { useSelector } from "react-redux";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useLocalizedText } from "../../../hook/useLocalizedText";
import type { TrainingCategory } from "../../../store/trening/treningCategoriesSlice";

type Props = {
  isLeft?: boolean;
  category: TrainingCategory[];
};

const Category = ({ isLeft, category }: Props) => {
  const changeLang = useLocalizedText();
  const lang = useSelector((state: any) => state.lang.lang);

  const content: Record<string, string> = {
    title: "Barcha Kategoriyalar",
    title_ru: "Все категории",
  };

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);

  return (
    <div className={s.wrapper}>
      <h2 className={cs(s.title, isLeft ? s.title_left : "")}>
        {content[changeLang("title")]}
      </h2>
      <div className={cs(s.row, isLeft ? s.left : "")}>
        {category.map((c) => (
          <Link to={`/training/${c.id}`} key={c.id} className={s.category}>
            <div className={s.img}>
              <img
                src={c.imageUrl}
                alt={pick(c.titleUz, c.titleRu)}
                loading="lazy"
              />
              {c.ageCategory && (
                <span className={s.badge}>
                  {c.ageCategory.minAge}–{c.ageCategory.maxAge}
                </span>
              )}
            </div>
            <div className={s.name}>{pick(c.titleUz, c.titleRu)}</div>
            {(c.descriptionUz || c.descriptionRu) && (
              <div className={s.desc}>
                {pick(c.descriptionUz, c.descriptionRu)}
              </div>
            )}
            {typeof c.lessonCount === "number" && (
              <div className={s.lessonCount}>
                <PlayCircleOutlined />
                <span>
                  {c.lessonCount}{" "}
                  {lang === "ru"
                    ? "уроков"
                    : lang === "en"
                      ? "lessons"
                      : "ta dars"}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Category;
