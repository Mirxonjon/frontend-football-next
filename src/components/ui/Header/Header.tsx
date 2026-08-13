"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  IdcardOutlined,
  BookOutlined,
  CrownOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import LangChange from "../LangChange/LangChange";
import Logo from "./../Logo/Logo";
import Container from "../Container/Container";
import { menu } from "../../../content/pages";
import { useLocalizedText } from "../../../hook/useLocalizedText";
import { useT } from "../../../hook/useT";
import FT_API from "../../../api/api";
import { tokens } from "../../../api/tokens";

function Header() {
  const [isOpen, setIsOpen] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarErrored, setAvatarErrored] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);
  const loyaut = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const openIcon = useRef<HTMLButtonElement | null>(null);
  const langChange = useLocalizedText();
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed?.avatarUrl === "string" &&
          (parsed.avatarUrl.startsWith("http://") ||
            parsed.avatarUrl.startsWith("https://"))
        ) {
          setAvatarUrl(parsed.avatarUrl);
        }
        const fn = parsed?.firstName || "";
        const ln = parsed?.lastName || "";
        const full = `${fn} ${ln}`.trim();
        if (full) setUserName(full);
        if (typeof parsed?.email === "string") setUserEmail(parsed.email);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        accountWrapRef.current &&
        !accountWrapRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    // Best-effort server-side logout: revoke the session so the refresh
    // token can no longer be used. Ignore network errors — we still want to
    // clear the local session and bounce the user to /login.
    try {
      await FT_API.post("/auth/logout");
    } catch {
      /* ignore */
    }
    tokens.clear();
    setToken(null);
    setAccountOpen(false);
    navigate("/login");
  };

  const handleToggleMenu = () => {
    const layout = document.querySelector<HTMLElement>(".hemburger_layout");
    if (layout) {
      layout.style.display = isOpen ? "flex" : "none";
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!loyaut.current) return;
    loyaut.current.childNodes.forEach((el) => {
      const a = el as HTMLAnchorElement;
      if (!a?.href) return;
      if (window.location.href.toLowerCase() === a.href.toLowerCase()) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });
  }, [location]);

  return (
    <Container>
      <header className="header_container">
        <Logo className={"header_logo"} />
        <div ref={loyaut} className="header_layout">
          {menu.length > 0 &&
            menu.map((el: any) =>
              el.external ? (
                <a
                  key={el.id}
                  className="header_layout_link"
                  href={el.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {el[langChange("name")]}
                </a>
              ) : (
                <Link key={el.id} className="header_layout_link" to={el.path}>
                  {el[langChange("name")]}
                </Link>
              )
            )}
        </div>
        <div className="container_signIn">
          <LangChange />
          {!token ? (
            <Link className="header_singin" to="/login">
              {t("Kirish", "Войти", "Sign In")}
            </Link>
          ) : (
            <div className="header_account_wrap" ref={accountWrapRef}>
              <button
                type="button"
                className="header_account"
                aria-label="Profile"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
              >
                {avatarUrl && !avatarErrored ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    onError={() => setAvatarErrored(true)}
                  />
                ) : (
                  <UserOutlined />
                )}
              </button>
              {accountOpen && (
                <div className="account_menu" role="menu">
                  <div className="account_menu_head">
                    <div className="account_menu_avatar">
                      {avatarUrl && !avatarErrored ? (
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>
                    <div className="account_menu_meta">
                      <div className="account_menu_name">
                        {userName || t("Foydalanuvchi", "Пользователь", "User")}
                      </div>
                      {userEmail && (
                        <div className="account_menu_email">{userEmail}</div>
                      )}
                    </div>
                  </div>
                  <div className="account_menu_divider" />
                  <Link
                    to="/user"
                    className="account_menu_item"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <IdcardOutlined />
                    <span>{t("Akkaunt", "Аккаунт", "Account")}</span>
                  </Link>
                  <Link
                    to="/me/books"
                    className="account_menu_item"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <BookOutlined />
                    <span>
                      {t("Mening kitoblarim", "Мои книги", "My books")}
                    </span>
                  </Link>
                  <Link
                    to="/me/subscriptions"
                    className="account_menu_item"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <CrownOutlined />
                    <span>{t("Obunalarim", "Подписки", "My subscriptions")}</span>
                  </Link>
                  <Link
                    to="/me/transactions"
                    className="account_menu_item"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <HistoryOutlined />
                    <span>
                      {t("Toʻlov tarixim", "История платежей", "Payment history")}
                    </span>
                  </Link>
                  <div className="account_menu_divider" />
                  <button
                    type="button"
                    className="account_menu_item account_menu_logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogoutOutlined />
                    <span>{t("Chiqish", "Выйти", "Log out")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            ref={openIcon}
            type="button"
            className="hamburger_menu"
            onClick={handleToggleMenu}
            aria-label={t("Menyuni ochish", "Открыть меню", "Open menu")}
          >
            <MenuFoldOutlined />
          </button>
          <div className="hemburger_layout">
            <button
              type="button"
              className="hamburger_menu_close"
              onClick={handleToggleMenu}
              aria-label={t("Menyuni yopish", "Закрыть меню", "Close menu")}
            >
              <MenuUnfoldOutlined />
            </button>
            <div className="hamburger_list">
              {menu.length > 0 &&
                menu.map((el: any) =>
                  el.external ? (
                    <a
                      key={el.id}
                      onClick={handleToggleMenu}
                      className="header_layout_link"
                      href={el.path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {el[langChange("name")]}
                    </a>
                  ) : (
                    <Link
                      onClick={handleToggleMenu}
                      key={el.id}
                      className="header_layout_link"
                      to={el.path}
                    >
                      {el[langChange("name")]}
                    </Link>
                  )
                )}
              {token ? (
                <>
                  <Link
                    onClick={handleToggleMenu}
                    className="header_layout_link header_layout_link_account"
                    to="/user"
                  >
                    <IdcardOutlined />
                    <span>{t("Akkaunt", "Аккаунт", "Account")}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleMenu();
                      handleLogout();
                    }}
                    className="header_layout_link header_layout_link_logout"
                  >
                    <LogoutOutlined />
                    <span>{t("Chiqish", "Выйти", "Log out")}</span>
                  </button>
                </>
              ) : (
                <Link
                  onClick={handleToggleMenu}
                  className="header_layout_link header_layout_link_account"
                  to="/login"
                >
                  <IdcardOutlined />
                  <span>{t("Kirish", "Войти", "Sign in")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </Container>
  );
}

export default Header;
