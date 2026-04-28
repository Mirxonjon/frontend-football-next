"use client";

import FormWrapper from "../../components/ui/FormWrapper/FormWrapper";
import MyButton from "../../components/ui/MyButton/MyButton";
import s from "./RegisterPage.module.scss";
import img from "./../../assets/img/bg1.png";
import { Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { Input, message } from "antd";
import moment from "moment";
import FT_API from "../../api/api";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const changaLang = useLocalizedText();
  const [userData, setUserData] = useState({
    name: "",
    surname: "",
    was_born: "",
    number: "",
    gmail: "",
    password: "",
  });

  async function RegisterFunc(e) {
    e.preventDefault();

    const res = await FT_API.post("/Auth/register", {
      ...userData,
    }).catch((err) => {
      messageApi.open({
        type: "error",
        content: err.response.data.message,
      });
    });
    if ((res as any)?.status === 201) {
      localStorage.setItem("token", (res as any).data.token);

      navigate("/");

        window.location.reload();
    }
  }

  const content = {
    title: "Xush kelibsiz!",
    title_ru: "Добро пожаловать!",
    subtitle:
      "Kuchli futbol mashg’ulotlari va taktikalardan foydalangan holda yuqori marralarni zabt eting!",
    subtitle_ru:
      "Доберитесь до вершины, используя мощную футбольную подготовку и тактику!",
    email: "Emailingizni kiriting",
    email_ru: "Введите электронной почты",
    password: "Parolni kiriting",
    password_ru: "Введите пароль",
    date: "Tug‘ilgan sana",
    date_ru: "Дата рождения",
    number: "Telefon nomer",
    number_ru: "Телефон номер",
    lastname: "Familiyangizni kiriting",
    lastname_ru: "Введите свою фамилию",
    lastname_label: "Familiya",
    lastname_label_ru: "Фамилия",
    name: "Ismingizni kiriting",
    name_ru: "Введите свою имию",
    name_label: "Ism",
    name_label_ru: "Имя",
    password_label: "Parol",
    password_label_ru: "Пароль",
    login: "Kirish",
    login_ru: "Ввойти",
    isodd: "Platformamizda ro‘yhatdan o‘tganmisiz?",
    isodd_ru: "Вы зарегистрированы на нашей платформе?",
    register: "Ro‘yhatdan o‘tish",
    register_ru: "Регистрация",
  };
  return (
    <>
            <Helmet>
            <title> CoachingZona registor</title>
            <meta name="description" content="CoachingZona registor, Coaching Zona  registor ,CoachingZone  registor , Coaching Zone registor" />
            <link rel='canonical' href='https://coachingzona.uz/login' />
          </Helmet>

    <FormWrapper
      title={content[changaLang("title")]}
      subTitle={content[changaLang("subtitle")]}
      img={img}
      >
      {contextHolder}
      <form onSubmit={RegisterFunc} className={s.form}>
        <div className={s.label}>{content[changaLang("name_label")]}</div>
        <Input
          required
          value={userData.name}
          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          className={s.input}
          placeholder={content[changaLang("name")]}
          />
        <div className={s.label}>{content[changaLang("lastname_label")]}</div>
        <Input
          required
          value={userData.surname}
          onChange={(e) =>
            setUserData({ ...userData, surname: e.target.value })
          }
          className={s.input}
          placeholder={content[changaLang("lastname")]}
          />
        <div className={s.row}>
          <div>
            <div className={s.label}>{content[changaLang("date")]}</div>
            <Input
              required
              value={moment(userData.was_born, "DD.MM.YYYY").format(
                "YYYY-MM-DD"
                )}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    was_born: moment(e.target.value, "YYYY-MM-DD").format(
                      "DD.MM.YYYY"
                      ),
                    })
                  }
                  className={s.input}
                  type="date"
                  placeholder="00.00.0000"
                  />
          </div>
          <div>
            <div className={s.label}>{content[changaLang("number")]}</div>
            <Input
              required
              value={userData.number}
              onChange={(e) => {
                if (e.target.value.slice(0, 4) !== "+998") {
                  e.target.value = "+998";
                } else if (e.target.value.length > 11) {
                  e.target.value = e.target.value.slice(0, 13);
                }
                setUserData({ ...userData, number: e.target.value });
              }}
              className={s.input}
              placeholder="+998"
              />
          </div>
        </div>
        <div className={s.label}>Email</div>
        <Input
          type="email"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
          title="Введите корректный email"
          required
          value={userData.gmail}
          onChange={(e) => setUserData({ ...userData, gmail: e.target.value })}
          className={s.input}
          placeholder={content[changaLang("email")]}
          />

        <div className={s.label}>{content[changaLang("password_label")]}</div>
        <Input.Password
          required
          value={userData.password}
          onChange={(e) =>
            setUserData({ ...userData, password: e.target.value })
          }
          className={s.input}
          placeholder={content[changaLang("password")]}
          />
        <div className={s.btn}>
          <MyButton>{content[changaLang("register")]}</MyButton>
        </div>
        <div className={s.register}>
          {content[changaLang("isodd")]}
          <Link to="/login"> {content[changaLang("login")]}</Link>
        </div>
      </form>
    </FormWrapper>
          </>
  );
};

export default RegisterPage;