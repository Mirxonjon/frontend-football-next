"use client";

import FormWrapper from "../../components/ui/FormWrapper/FormWrapper";
import MyButton from "../../components/ui/MyButton/MyButton";
import s from "./LoginPage.module.scss";
import img from "./../../assets/img/bg2.png";
import { Link } from "@/lib/router-compat";
import { Input, message } from "antd";
import { useState } from "react";
import FT_API from "../../api/api";
import { tokens } from "../../api/tokens";
import { langFromUserModel } from "../../api/userLanguage";
import { langActions } from "../../store/slice/lang";
import { useDispatch } from "react-redux";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton/GoogleAuthButton";
import g from "@/components/ui/GoogleAuthButton/GoogleAuthButton.module.scss";

type LoginResponse = {
  status_code: number;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: number;
      phone: string | null;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      isVerified: boolean;
    };
  };
};

const LoginPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const changaLang = useLocalizedText();

  async function LoginFunc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const res = await FT_API.post<LoginResponse>(
        "/auth/email/login",
        userData
      );
      const accessToken = res.data?.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken;

      if (accessToken) {
        tokens.save({ accessToken, refreshToken });
        if (res.data?.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.data.user));
          // Sync app language with the server-side preference for this user.
          const serverLang = langFromUserModel(
            (res.data.data.user as any)?.language
          );
          if (serverLang) dispatch(langActions.setLang(serverLang));
        }
        window.location.href = "/";
      } else {
        messageApi.open({
          type: "error",
          content: "Token kelmadi — backend javobini tekshiring",
        });
      }
    } catch (err: any) {
      messageApi.open({
        type: "error",
        content:
          err?.response?.data?.message || err?.message || "Login failed",
      });
    }
  }

  const content: Record<string, string> = {
    title: "Xush kelibsiz!",
    title_ru: "Добро пожаловать!",
    title_en: "Welcome back!",
    subtitle: "Iltimos, davom etish uchun maʼlumotlarni kiriting!",
    subtitle_ru: "Пожалуйста, введите данные, чтобы продолжить!",
    subtitle_en: "Please enter your details to continue.",
    email: "Emailingizni kiriting",
    email_ru: "Введите электронной почты",
    email_en: "Enter your email",
    password: "Parolni kiriting",
    password_ru: "Введите пароль",
    password_en: "Enter your password",
    login: "Kirish",
    login_ru: "Ввойти",
    login_en: "Sign in",
    isnew: "Platformamizda yangimisiz?",
    isnew_ru: "Впервые на нашей платформе?",
    isnew_en: "New to our platform?",
    register: "Ro‘yhatdan o‘tish",
    register_ru: "Регистрация",
    register_en: "Sign up",
    password_label: "Parol",
    password_label_ru: "Пароль",
    password_label_en: "Password",
  };

  return (
    <>
      <Helmet>
        <title>CoachingZona Login</title>
        <meta
          name="description"
          content="CoachingZona login, Coaching Zona login, CoachingZone login, Coaching Zone login"
        />
        <link rel="canonical" href="https://coachingzona.uz/login" />
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
            value={userData.email}
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
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
          <div className={g.divider}>yoki</div>
          <div className={g.wrap}>
            <GoogleAuthButton text="signin_with" />
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
