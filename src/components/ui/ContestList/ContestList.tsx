"use client";

import s from "./ContestList.module.scss";
import Pagination from "../Pagination/Pagination";
import cs from "classnames";
import { Link } from "@/lib/router-compat";
import { useDispatch, useSelector } from "react-redux";
import {
  competitionCategoryActions,
  getCompetitionCategory,
} from "../../../store/competion/competitionCatSlice";
import { useLocalizedText } from "../../../hook/useLocalizedText";

const ContestList = ({ isLeft, category }: any) => {
  const dispatch = useDispatch<any>();
  const changeLang = useLocalizedText();

  const content = {
    title: "Barcha Kurslar",
    title_ru: "Все Курсы",
  };

  const paginationParams = useSelector((state: any) => state.competition.pagination);

  function setPaginationParams(paginationParams) {
    dispatch(competitionCategoryActions.setPagination(paginationParams));
    dispatch(getCompetitionCategory());
  }

  return (
    <div className={s.wrapper}>
      <h2 className={cs(s.title, isLeft ? s.title_left : "")}>
        {content[changeLang("title")]}
      </h2>
      <div className={cs(s.row, isLeft ? s.left : "")}>
        {category?.length &&
          category.map((c) => (
            <Link to={c.id} key={c.id} className={s.category}>
              <div className={s.img}>
                <img
                  src={"https://storage.googleapis.com/telecom2003/" + c.image}
                  height={"200px"}
                  alt={"category"}
                />
              </div>
              <div className={s.name}>{c[changeLang("title")]}</div>
            </Link>
          ))}
      </div>

      <Pagination
        paginationParams={paginationParams}
        setPaginationParams={setPaginationParams}
      />
    </div>
  );
};

export default ContestList;