"use client";

import s from "./individualTrainingCategory.module.scss";
import Pagination from "../Pagination/Pagination";
import cs from "classnames";
import { Link } from "@/lib/router-compat";
import { useDispatch, useSelector } from "react-redux";
import { useLocalizedText } from "../../../hook/useLocalizedText";
import { getIndividualTreningCategoryWithCategory, individualtreningCategoryActions } from "../../../store/individualTraining/IndividualTreningCategoriesSlice";

const IndividualTrainingCategory = ({ isLeft, category }: any) => {
  const dispatch = useDispatch<any>();
  const changeLang = useLocalizedText();
  const paginationParams = useSelector(
    (state: any) => state.individualTreningCategory.pagination
  );
console.log(paginationParams);
  const content = {
    title: "Barcha Kategoriyalar",
    title_ru: "Все категории",
  };

  function setPaginationParams(paginationParams) {
    dispatch(individualtreningCategoryActions.setPagination(paginationParams));
    dispatch(getIndividualTreningCategoryWithCategory());
  }

  return (
    <div className={s.wrapper}>
      <h2 className={cs(s.title, isLeft ? s.title_left : "")}>
        {content[changeLang("title")]}
      </h2>
      <div className={cs(s.row, isLeft ? s.left : "")}>
        {category?.length &&
          category.map((c, i) => (
            <Link to={c.id} key={c.id} className={s.category}>
              <div className={s.img}>
                <img
                  src={"https://storage.googleapis.com/telecom2003/" + c.image}
                  height={"200px"}
                  alt={"category"}
                />
              </div>
              <div className={s.name}>
                {category[i][changeLang("title")]}
              </div>
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

export default IndividualTrainingCategory;