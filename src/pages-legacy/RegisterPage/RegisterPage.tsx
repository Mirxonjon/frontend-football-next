"use client";

import FormWrapper from "../../components/ui/FormWrapper/FormWrapper";
import MyButton from "../../components/ui/MyButton/MyButton";
import s from "./RegisterPage.module.scss";
import img from "./../../assets/img/bg1.png";
import { Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { Input, message } from "antd";
import FT_API from "../../api/api";
import { tokens } from "../../api/tokens";
import { langFromUserModel } from "../../api/userLanguage";
import { langActions } from "../../store/slice/lang";
import { useDispatch } from "react-redux";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton/GoogleAuthButton";
import g from "@/components/ui/GoogleAuthButton/GoogleAuthButton.module.scss";

type RegisterResponse = {
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  const changaLang = useLocalizedText();
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  async function RegisterFunc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const res = await FT_API.post<RegisterResponse>(
        "/auth/email/register",
        userData
      );
      const accessToken = res.data?.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken;

      if (accessToken) {
        tokens.save({ accessToken, refreshToken });
        if (res.data?.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.data.user));
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
          err?.response?.data?.message ||
          err?.message ||
          "Registration failed",
      });
    }
  }

  const content: Record<string, string> = {
    title: "Xush kelibsiz!",
    title_ru: "Добро пожаловать!",
    title_en: "Welcome!",
    subtitle:
      "Kuchli futbol mashg’ulotlari va taktikalardan foydalangan holda yuqori marralarni zabt eting!",
    subtitle_ru:
      "Доберитесь до вершины, используя мощную футбольную подготовку и тактику!",
    subtitle_en:
      "Reach the top with strong football training and tactics!",
    email: "Emailingizni kiriting",
    email_ru: "Введите электронной почты",
    email_en: "Enter your email",
    password: "Parolni kiriting",
    password_ru: "Введите пароль",
    password_en: "Enter your password",
    lastname: "Familiyangizni kiriting",
    lastname_ru: "Введите свою фамилию",
    lastname_en: "Enter your last name",
    lastname_label: "Familiya",
    lastname_label_ru: "Фамилия",
    lastname_label_en: "Last name",
    name: "Ismingizni kiriting",
    name_ru: "Введите свою имию",
    name_en: "Enter your first name",
    name_label: "Ism",
    name_label_ru: "Имя",
    name_label_en: "First name",
    password_label: "Parol",
    password_label_ru: "Пароль",
    password_label_en: "Password",
    login: "Kirish",
    login_ru: "Ввойти",
    login_en: "Sign in",
    isodd: "Platformamizda ro‘yhatdan o‘tganmisiz?",
    isodd_ru: "Вы зарегистрированы на нашей платформе?",
    isodd_en: "Already have an account?",
    register: "Ro‘yhatdan o‘tish",
    register_ru: "Регистрация",
    register_en: "Sign up",
  };

  return (
    <>
      <Helmet>
        <title>CoachingZona registor</title>
        <meta
          name="description"
          content="CoachingZona registor, Coaching Zona registor, CoachingZone registor, Coaching Zone registor"
        />
        <link rel="canonical" href="https://coachingzona.uz/register" />
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
            value={userData.firstName}
            onChange={(e) =>
              setUserData({ ...userData, firstName: e.target.value })
            }
            className={s.input}
            placeholder={content[changaLang("name")]}
          />

          <div className={s.label}>{content[changaLang("lastname_label")]}</div>
          <Input
            required
            value={userData.lastName}
            onChange={(e) =>
              setUserData({ ...userData, lastName: e.target.value })
            }
            className={s.input}
            placeholder={content[changaLang("lastname")]}
          />

          <div className={s.label}>Email</div>
          <Input
            type="email"
            required
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
            minLength={8}
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
          <div className={g.divider}>yoki</div>
          <div className={g.wrap}>
            <GoogleAuthButton text="signup_with" />
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
