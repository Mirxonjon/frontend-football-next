"use client";

import s from "./AgesCategory.module.scss";
import img1 from "./../../../assets/img/age1.png";
import img2 from "./../../../assets/img/age2.png";
import img3 from "./../../../assets/img/age3.png";
import img4 from "./../../../assets/img/age4.png";
import { useDispatch, useSelector } from "react-redux";
import {
  getTreningCategoryWithAge,
  treningCategoryActions,
} from "../../../store/trening/treningCategoriesSlice";
import { Link } from "@/lib/router-compat";

const ages = [
  { id: 1, img: img1, value: "5-8", name: { uz: "5-8 yoshdagilar", ru: "5-8 летним" } },
  { id: 2, img: img2, value: "9-13", name: { uz: "9-13 yoshdagilar", ru: "9-13 летним" } },
  { id: 3, img: img3, value: "14-17", name: { uz: "14-17 yoshdagilar", ru: "14-17 летним" } },
  { id: 4, img: img4, value: "18-21", name: { uz: "18-21 yoshdagilar", ru: "18-21 летним" } },
];
const  individualCategoryLang= {
  name:  { uz: "Individual trenirovka", ru: "Индивидуальное обучение" },
  value : 'Individual trenirovka'
}

const AgesCategory = () => {
  const dispatch = useDispatch<any>();
  const lang = useSelector((state: any) => state.lang.lang);

  const getLocalizedText = (content) => {
    return content && content[lang] ? content[lang] : content;
  };


  return (
    <div className={s.row}>
      {ages.length &&
        ages.map((age) => (
          <div
            onClick={() => {
              dispatch(
                treningCategoryActions.setPagination({ currentPage: 1 })
              );
              dispatch(treningCategoryActions.setAge(age.value));
              dispatch(getTreningCategoryWithAge());
            }}
            key={age.id}
            className={s.item}
          >
            <img src={(age.img.src ?? age.img) as string} alt={age.value} />
            {/* Используйте getLocalizedText для отображения правильного перевода в зависимости от языка */}
            <span>{getLocalizedText(age.name)}</span>
          </div>
        ))}
         <Link
                    key={11}
                    to={'/individualtraining'}
                  >
         <div
            className={s.item}
          >
            <img src={(img2.src ?? img2) as string} alt={individualCategoryLang.value} />
            {/* Используйте getLocalizedText для отображения правильного перевода в зависимости от языка */}
            {/* <span>Индивидуальный</span> */}
            <span>{getLocalizedText(individualCategoryLang.name)}</span>
          </div>
          </Link>

    </div>
  );
};

export default AgesCategory;