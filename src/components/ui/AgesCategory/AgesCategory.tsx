"use client";

import s from "./AgesCategory.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { treningCategoryActions } from "../../../store/trening/treningCategoriesSlice";
import type { AgeCategory } from "../../../store/trening/treningCategoriesSlice";
import { Link } from "@/lib/router-compat";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";

type Props = {
  ageCategories: AgeCategory[];
};

const AgesCategory = ({ ageCategories }: Props) => {
  const dispatch = useDispatch<any>();
  const lang = useSelector((state: any) => state.lang.lang);
  const selectedAgeId = useSelector(
    (state: any) => state.treningCategory.selectedAgeId
  );

  const pickTitle = (ac: AgeCategory) =>
    lang === "ru" ? ac.titleRu : ac.titleUz;

  return (
    <div className={s.row}>
      <button
        type="button"
        className={`${s.chip} ${selectedAgeId === null ? s.active : ""}`}
        onClick={() => dispatch(treningCategoryActions.setSelectedAge(null))}
      >
        <TeamOutlined />
        <span>
          {lang === "ru" ? "Все" : lang === "en" ? "All" : "Barchasi"}
        </span>
      </button>

      {ageCategories.map((ac) => (
        <button
          type="button"
          key={ac.id}
          className={`${s.chip} ${selectedAgeId === ac.id ? s.active : ""}`}
          onClick={() =>
            dispatch(treningCategoryActions.setSelectedAge(ac.id))
          }
          title={`${ac.minAge}–${ac.maxAge} ${
            lang === "ru" ? "лет" : lang === "en" ? "y/o" : "yosh"
          }`}
        >
          {ac.iconUrl ? (
            <img src={ac.iconUrl} alt={pickTitle(ac)} />
          ) : (
            <span className={s.range}>
              {ac.minAge}–{ac.maxAge}
            </span>
          )}
          <span>{pickTitle(ac)}</span>
        </button>
      ))}

      <Link to="/individualtraining" className={s.individualLink}>
        <div className={s.chip}>
          <UserOutlined />
          <span>
            {lang === "ru"
              ? "Индивидуальное"
              : lang === "en"
                ? "Individual"
                : "Individual"}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default AgesCategory;
