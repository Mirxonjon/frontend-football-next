"use client";

import { useSelector } from "react-redux";
import c from "./Statistics.module.scss";

const content = {
  members: "azolar",
  members_ru: "участники",
  masterclass: "masterklass",
  masterclass_ru: "мастер-класс",
  units_sold: "sotilgan",
  units_sold_ru: "проданные",
  head_coachs: "murabbiylar",
  head_coachs_ru: "тренеры",
};

const Statistics = () => {
  // Получаем текущий язык из Redux store
  const lang = useSelector((state: any) => state.lang.lang);

  // Функция для получения локализованного текста
  const getLocalizedText = (key) => {
    return content[`${key}_${lang}`] || content[key];
  };

  return (
    <div className={c.wrapper}>
      <div
        data-aos="zoom-out"
        data-aos-duration="1500"
        data-aos-offset="300"
        className={c.item}
      >
        <div className={c.number}>102</div>
        <div className={c.string}>{getLocalizedText("members")}</div>
      </div>
      <div
        data-aos="zoom-out"
        data-aos-duration="1500"
        data-aos-offset="300"
        className={c.item}
      >
        <div className={c.number}>50</div>
        <div className={c.string}>{getLocalizedText("units_sold")}</div>
      </div>
      <div
        data-aos="zoom-out"
        data-aos-duration="1500"
        data-aos-offset="300"
        className={c.item}
      >
        <div className={c.number}>22</div>
        <div className={c.string}>{getLocalizedText("head_coachs")}</div>
      </div>
      <div
        data-aos="zoom-out"
        data-aos-duration="1500"
        data-aos-offset="300"
        className={c.item}
      >
        <div className={c.number}>20</div>
        <div className={c.string}>{getLocalizedText("masterclass")}</div>
      </div>
    </div>
  );
};

export default Statistics;