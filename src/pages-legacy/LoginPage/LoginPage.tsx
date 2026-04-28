"use client";

import FormWrapper from "../../components/ui/FormWrapper/FormWrapper";
import MyButton from "../../components/ui/MyButton/MyButton";
import s from "./LoginPage.module.scss";
import img from "./../../assets/img/bg2.png";
import { Link, useNavigate } from "@/lib/router-compat";
import { Input, message } from "antd";
import { useState } from "react";
import FT_API from "../../api/api";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";
const LoginPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [userData, setUserData] = useState({
    gmail: "",
    password: "",
  });
  const changaLang = useLocalizedText();
  async function LoginFunc(e) {
    e.preventDefault();
    FT_API.post("/Auth/SignIn", {
      ...userData,
    })
      .then((data) => {
        if (data.status === 200) {
          localStorage.setItem("token", data.data.token);

          navigate("/");

        window.location.reload();
        }
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content: err.response.data.message,
        });
      });
  }
  const content = {
    title: "Xush kelibsiz!",
    title_ru: "Добро пожаловать!",
    subtitle: "Iltimos, davom etish uchun maʼlumotlarni kiriting!",
    subtitle_ru: "Пожалуйста, введите данные, чтобы продолжить!",
    email: "Emailingizni kiriting",
    email_ru: "Введите электронной почты",
    password: "Parolni kiriting",
    password_ru: "Введите пароль",
    login: "Kirish",
    login_ru: "Ввойти",
    isnew: "Platformamizda yangimisiz?",
    isnew_ru: "Впервые на нашей платформе?",
    register: "Ro‘yhatdan o‘tish",
    register_ru: "Регистрация",
    password_label: "Parol",
    password_label_ru: "Пароль",
  };
  return (
    <>
        <Helmet>
            <title> CoachingZona Login</title>
            <meta name="description" content="CoachingZona login, Coaching Zona login ,CoachingZone login , Coaching Zone login" />
            <link rel='canonical' href='https://coachingzona.uz/login' />
          </Helmet>
    <FormWrapper
      title={content[changaLang("title")]}
      subTitle={content[changaLang("subtitle")]}
      img={img}
    >
      {contextHolder}
      <form onSubmit={LoginFunc} className={s.form}>
        <div className={s.label}>Email</div>
        <Input
          required
          type="email"
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
          <MyButton>{content[changaLang("login")]}</MyButton>
        </div>
        <div className={s.register}>
          {content[changaLang("isnew")]}
          <Link to="/register"> {content[changaLang("register")]}</Link>
        </div>
      </form>
    </FormWrapper>
    </>

  );
};

export default LoginPage;