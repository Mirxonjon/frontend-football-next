"use client";

import { useState, useEffect, useRef } from "react";
import { GlobalOutlined, CheckOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { langActions } from "../../../store/slice/lang";
import { syncUserLanguage } from "../../../api/userLanguage";

const LANGS: { code: "uz" | "ru" | "en"; label: string; flag: string }[] = [
  { code: "uz", label: "O‘zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

function LangChange() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch<any>();
  const { lang } = useSelector((state: any) => state.lang);

  const handlePick = (code: "uz" | "ru" | "en") => {
    dispatch(langActions.setLang(code));
    setOpen(false);
    // Persist server-side too, when authenticated and backend supports the
    // chosen language. Fire-and-forget — UI doesn't wait for the response.
    void syncUserLanguage(code);
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="header_lang" ref={wrapRef}>
      <button
        type="button"
        className={`header_lang_trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobalOutlined />
        <span className="header_lang_code">{lang}</span>
      </button>

      {open && (
        <div className="header_lang_select" role="listbox">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={lang === l.code}
              className={`select_btn ${lang === l.code ? "is-active" : ""}`}
              onClick={() => handlePick(l.code)}
            >
              <span className="select_btn_flag" aria-hidden="true">
                {l.flag}
              </span>
              <span className="select_btn_label">{l.label}</span>
              {lang === l.code && (
                <CheckOutlined className="select_btn_check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LangChange;
