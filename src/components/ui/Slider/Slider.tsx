"use client";

import c from "./Slider.module.scss";
import img1 from "./../../../assets/img/slider.png";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMasterclassCategories,
  type MasterclassCategory,
} from "../../../store/masterclass/masterclassSlice";
import { useEffect } from "react";
import { Link } from "@/lib/router-compat";

const MySilder = () => {
  const dispatch = useDispatch<any>();
  const categories = useSelector(
    (state: any) =>
      (state.masterclass?.categories ?? []) as MasterclassCategory[]
  );
  const lang = useSelector((state: any) => state.lang.lang);
  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchMasterclassCategories());
    }
  }, [dispatch, categories.length]);

  return (
    <div className={c.row}>
      {categories.length > 0
        ? categories.slice(0, 3).map((el) => (
            <Link
              to={"/masterclass/" + el.id}
              data-aos-duration="1500"
              data-aos-offset="300"
              data-aos="fade-right"
              className={c.item}
              key={el.id}
            >
              <div className={c.img}>
                <img src={(img1.src ?? img1) as string} alt="trener photo" />
              </div>
              <div className={c.role}>
                {lang === "ru"
                  ? "Мастер-класс"
                  : lang === "en"
                    ? "Masterclass"
                    : "Masterclass"}
              </div>
              <div className={c.name}>{pick(el.titleUz, el.titleRu)}</div>
              <div className={c.description}>
                {pick(el.descriptionUz, el.descriptionRu)}
              </div>
            </Link>
          ))
        : ""}
    </div>
  );
};

export default MySilder;
