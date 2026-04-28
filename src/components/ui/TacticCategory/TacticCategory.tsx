"use client";

import s from "./TacticCategory.module.scss";
import img1 from "./../../../assets/img/age1.png";
import img2 from "./../../../assets/img/age2.png";
import img3 from "./../../../assets/img/age3.png";
import img4 from "./../../../assets/img/age4.png";
import { useDispatch, useSelector } from "react-redux";
// import {
//   getTreningCategoryWithAge,
//   individualtreningCategoryActions,
// } from "../../../store/trening/treningCategoriesSlice";
import {  getIndividualTreningCategoryWithCategory, individualtreningCategoryActions } from "../../../store/individualTraining/IndividualTreningCategoriesSlice";

const tactics = [
  { id: 1, img: img1, value: "texnika", name: { uz: "Texnika", ru: "Техника" } },
  { id: 2, img: img2, value: "taktika", name: { uz: "Taktika", ru: "Тактика" } },
  { id: 3, img: img3, value: "fizika", name: { uz: "Fizika", ru: "Физика" } },
  { id: 4, img: img4, value: "psixologiya", name: { uz: "Psixologiya", ru: "Психология" } },
];

const TacticCategory = () => {
  const dispatch = useDispatch<any>();
  const lang = useSelector((state: any) => state.lang.lang);

  const getLocalizedText = (content) => {
    return content && content[lang] ? content[lang] : content;
  };


  return (
    <div className={s.row}>
      {tactics.length &&
        tactics.map((tactic) => (
          <div
            onClick={() => {
              dispatch(
                individualtreningCategoryActions.setPagination({ currentPage: 1 })
              );
              dispatch(individualtreningCategoryActions.setAge(tactic.value));
              dispatch(getIndividualTreningCategoryWithCategory());
            }}
            key={tactic.id}
            className={s.item}
          >
            <img src={(tactic.img.src ?? tactic.img) as string} alt={tactic.value} />
            {/* Используйте getLocalizedText для отображения правильного перевода в зависимости от языка */}
            <span>{getLocalizedText(tactic.name)}</span>
          </div>
        ))}
    </div>
  );
};

export default TacticCategory;