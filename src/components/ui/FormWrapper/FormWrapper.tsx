"use client";

import Logo from "../Logo/Logo";
import s from "./FormWrapper.module.scss";
type FormWrapperProps = {
  img?: any;
  title?: any;
  subTitle?: any;
  children?: React.ReactNode;
};

const FormWrapper = ({ img, title, subTitle, children }: FormWrapperProps) => {
  const imgSrc = typeof img === "string" ? img : img?.src;
  return (
    <div className={s.flexWrap}>
      <div className={s.logo}>
        <Logo />
      </div>
      <div className={s.wrapper}>
        <div className={s.left}>
          <div className={s.form}>
            <h1 className={s.title}>{title}</h1>
            <h2 className={s.subTitle}>{subTitle}</h2>
            {children}
          </div>
        </div>
        <div className={s.img}>
          <img src={imgSrc} alt="bg img" />
        </div>
      </div>
      <div className={s.footer}>© 2024 FutbolLab.</div>
    </div>
  );
};

export default FormWrapper;