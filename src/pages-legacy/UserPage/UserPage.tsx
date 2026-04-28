"use client";

import { useEffect, useState } from "react";
import Container from "../../components/ui/Container/Container";
import s from "./UserPage.module.scss";
import img from "./../../assets/img/acc.svg";
import { useLocalizedText } from "../../hook/useLocalizedText";
import moment from "moment";
import MyButton from "../../components/ui/MyButton/MyButton";
import FT_API from "../../api/api";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";

const UserPage = () => {
  const navigate = useNavigate();
  const langChange = useLocalizedText();
  const content = {
    surname: "Familiya",
    surname_ru: "Фамилия",
    name: "Ism",
    name_ru: "Имя",
    phone: "Telefon",
    phone_ru: "Телефон",
    email: "Email",
    email_ru: "Email",
    password: "Parol",
    password_ru: "Пароль",
    was_born_date: "Tug'ilgan sana",
    was_born_date_ru: "Дата рождения",
    avatar: "Rasm",
    avatar_ru: "Фото",
    change: "O'zgartirish",
    change_ru: "Изменить",
  };
  const [user, setUser] = useState({
    id: "",
    email: "",
    image: "",
    name: "",
    password: "",
    phone: "",
    role: "",
    surname: "",
    was_born_date: "",
  });
  useEffect(() => {
    async function fetch() {
      try {
        const res = await FT_API.get("/Users/one");
        setUser(await res.data);
      } catch (error) {
        if (error.response.status == 400) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    }
    fetch();
  }, []);

  return (
    <Container>
          <Helmet>
            <title> CoachingZona Accaunt</title>
            <meta name="description" content="CoachingZona accaunt , CoachingZona accaunt update" />
            <link rel='canonical' href='https://coachingzona.uz/user' />
          </Helmet>
      <div className={s.row}>
        <div className={s.img}>
          <img width={200} src={user.image ? user.image : (img as any).src} alt="avatar" />
        </div>
        <div className={s.info}>
          <div className={s.item}>
            <div className={s.label}> {content[langChange("surname")]}</div>
            <div className={s.value}>{user.surname}</div>
          </div>
          <div className={s.item}>
            <div className={s.label}> {content[langChange("name")]}</div>
            <div className={s.value}>{user.name}</div>
          </div>
          <div className={s.item}>
            <div className={s.label}> {content[langChange("phone")]}</div>
            <div className={s.value}>{user.phone}</div>
          </div>
          <div className={s.item}>
            <div className={s.label}> {content[langChange("email")]}</div>
            <div className={s.value}>{user.email}</div>
          </div>
          <div className={s.item}>
            <div className={s.label}> {content[langChange("password")]}</div>
            <div className={s.value}>{user.password}</div>
          </div>
          <div className={s.item}>
            <div className={s.label}>
              {content[langChange("was_born_date")]}
            </div>
            <div className={s.value}>
              {moment(user.was_born_date, "DD.MM.YYYY").format("YYYY-MM-DD")}
            </div>
          </div>

          <div className={s.btn}>
            <MyButton
              onClick={() => {
                navigate("/userupdate");
              }}
            >
              {content[langChange("change")]}
            </MyButton>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default UserPage;