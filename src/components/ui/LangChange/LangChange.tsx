"use client";

import { useState, useEffect } from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { langActions } from "../../../store/slice/lang";

function LangChange() {
  const [isOpenLang, setIsOpenLang] = useState(false);
  const dispatch = useDispatch<any>();
  // eslint-disable-next-line no-unused-vars
  const { lang, loading } = useSelector((state: any) => state.lang);

  const handleLang = () => {
    const el = document.querySelector<HTMLElement>(".header_lang_select");
    if (!el) return;
    if (isOpenLang) {
      el.style.display = "none";
    } else {
      el.style.display = "block";
    }
    setIsOpenLang(!isOpenLang);
  };

  const handleLanguageSelect = (selectedLang: any) => {
    dispatch(langActions.setLang(selectedLang));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const select = document.querySelector<HTMLElement>(".header_lang_select");
      if (
        target &&
        !target.closest(".header_lang") &&
        select?.style?.display === "block"
      ) {
        select.style.display = "none";
        setIsOpenLang(false);
      }
    };
    document.body.addEventListener("click", handler);
    return () => document.body.removeEventListener("click", handler);
  }, []);

  return (
    <div className="header_lang" onClick={handleLang}>
      <GlobalOutlined /> {lang}
      <div className="header_lang_select">
        <button
          className="select_btn"
          onClick={() => handleLanguageSelect("uz")}
        >
          Uz
        </button>
        <button
          className="select_btn"
          onClick={() => handleLanguageSelect("ru")}
        >
          Ru
        </button>
      </div>
    </div>
  );
}

export default LangChange;
