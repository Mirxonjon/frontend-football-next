"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import LangChange from "../LangChange/LangChange";
import Logo from "./../Logo/Logo";
import Container from "../Container/Container";
import { menu } from "../../../content/pages";
import { useLocalizedText } from "../../../hook/useLocalizedText";
import accImg from "./../../../assets/img/acc.svg";

function Header() {
  const [isOpen, setIsOpen] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const loyaut = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const openIcon = useRef<HTMLDivElement | null>(null);
  const langChange = useLocalizedText();

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
  }, []);

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
            menu.map((el: any) => (
              <Link key={el.id} className="header_layout_link" to={el.path}>
                {el[langChange("name")]}
              </Link>
            ))}
        </div>
        <div className="container_signIn">
          <LangChange />
          {!token ? (
            <Link className="header_singin" to="/login">
              Sign In
            </Link>
          ) : (
            <Link className="header_account" to="/user">
              <img src={(accImg as any).src ?? accImg} alt="account logo" />
            </Link>
          )}
          <div
            ref={openIcon}
            className="hamburger_menu"
            onClick={handleToggleMenu}
          >
            <MenuFoldOutlined />
          </div>
          <div className="hemburger_layout">
            <div className="hamburger_menu_close" onClick={handleToggleMenu}>
              <MenuUnfoldOutlined />
            </div>
            <div className="hamburger_list">
              {menu.length > 0 &&
                menu.map((el: any) => (
                  <Link
                    onClick={handleToggleMenu}
                    key={el.id}
                    className="header_layout_link"
                    to={el.path}
                  >
                    {el[langChange("name")]}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </header>
    </Container>
  );
}

export default Header;
