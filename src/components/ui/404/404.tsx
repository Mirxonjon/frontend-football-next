"use client";

import s from "./404.module.scss";

const NotFound = ({ title, subTitle, style }: any) => {
  return (
    <div style={style} className={s.wrapper}>
      <div className={s.title}>{title?.length ? title : 404}</div>
      <div className={s.subTitle}>
        {subTitle?.length ? subTitle : "Not Found"}
      </div>
    </div>
  );
};

export default NotFound;