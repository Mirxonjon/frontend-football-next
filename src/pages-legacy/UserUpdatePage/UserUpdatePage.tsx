"use client";

import { useEffect, useState } from "react";
import Container from "../../components/ui/Container/Container";
import s from "./UserUpdatePage.module.scss";
import img from "./../../assets/img/acc.svg";
import { useLocalizedText } from "../../hook/useLocalizedText";
import moment from "moment";
import MyButton from "../../components/ui/MyButton/MyButton";
import FT_API from "../../api/api";
import { useNavigate } from "@/lib/router-compat";
import { Input } from "antd";
import { Helmet } from "@/lib/helmet-compat";

type ApiUser = {
  id: number;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
};

const isPlaceholderPhone = (phone?: string | null) =>
  !!phone && (phone.startsWith("google_") || phone.startsWith("unset_"));

const UserUpdatePage = () => {
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
    was_born_date: "Tug'ilgan sana",
    was_born_date_ru: "Дата рождения",
    avatar: "Rasm URL",
    avatar_ru: "URL фото",
    save: "Saqlash",
    save_ru: "Сохранить",
    cancel: "Bekor qilish",
    cancel_ru: "Отмена",
    saved: "Saqlandi",
    saved_ru: "Сохранено",
    error: "Xatolik yuz berdi",
    error_ru: "Произошла ошибка",
  } as const;

  const [user, setUser] = useState<ApiUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD for <input type="date">
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await FT_API.get("/users/me");
        const u: ApiUser = res.data?.data ?? res.data;
        if (cancelled) return;
        setUser(u);
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setBirthDate(u.birthDate ? moment(u.birthDate).format("YYYY-MM-DD") : "");
        setAvatarUrl(u.avatarUrl ?? "");
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 400) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          navigate("/login");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    // Build payload — only send fields the backend accepts.
    const payload: Record<string, unknown> = {};
    if (firstName !== (user?.firstName ?? "")) payload.firstName = firstName;
    if (lastName !== (user?.lastName ?? "")) payload.lastName = lastName;
    if (avatarUrl !== (user?.avatarUrl ?? "")) payload.avatarUrl = avatarUrl;

    const newDateIso = birthDate ? new Date(birthDate).toISOString() : null;
    const oldDateIso = user?.birthDate ?? null;
    if (newDateIso !== oldDateIso) payload.birthDate = newDateIso;

    try {
      const res = await FT_API.patch("/users/me", payload);
      const updated: ApiUser = res.data?.data ?? res.data;
      setUser(updated);
      setFeedback({ type: "ok", text: content[langChange("saved")] });
      // Brief feedback then return to profile page.
      setTimeout(() => navigate("/user"), 700);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || content[langChange("error")];
      setFeedback({ type: "err", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container>
      <Helmet>
        <title>CoachingZona Accaunt</title>
        <meta
          name="description"
          content="CoachingZona accaunt , CoachingZona accaunt update"
        />
        <link rel="canonical" href="https://coachingzona.uz/user" />
      </Helmet>
      <div className={s.row}>
        <div className={s.img}>
          <img
            width={200}
            src={avatarUrl || (img as any).src}
            alt="avatar"
          />
        </div>
        <form onSubmit={submit} className={s.info}>
          <div className={s.item}>
            <div className={s.label}>{content[langChange("surname")]}</div>
            <div className={s.value}>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={content[langChange("surname")]}
              />
            </div>
          </div>

          <div className={s.item}>
            <div className={s.label}>{content[langChange("name")]}</div>
            <div className={s.value}>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={content[langChange("name")]}
              />
            </div>
          </div>

          {/* Phone: read-only. Hide Google placeholder. */}
          {!isPlaceholderPhone(user?.phone) && user?.phone && (
            <div className={s.item}>
              <div className={s.label}>{content[langChange("phone")]}</div>
              <div className={s.value}>
                <Input value={user.phone} disabled />
              </div>
            </div>
          )}

          {/* Email: read-only (backend does not accept email change here). */}
          {user?.email && (
            <div className={s.item}>
              <div className={s.label}>{content[langChange("email")]}</div>
              <div className={s.value}>
                <Input value={user.email} disabled />
              </div>
            </div>
          )}

          <div className={s.item}>
            <div className={s.label}>{content[langChange("was_born_date")]}</div>
            <div className={s.value}>
              <Input
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={s.input}
                type="date"
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div className={s.item}>
            <div className={s.label}>{content[langChange("avatar")]}</div>
            <div className={s.value}>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {feedback && (
            <div
              className={s.item}
              style={{
                color: feedback.type === "ok" ? "#16a34a" : "#dc2626",
                fontWeight: 500,
              }}
            >
              {feedback.text}
            </div>
          )}

          <div className={s.btn} style={{ display: "flex", gap: 12 }}>
            <MyButton onClick={() => navigate("/user")} disabled={submitting}>
              {content[langChange("cancel")]}
            </MyButton>
            <MyButton disabled={submitting}>
              {submitting ? "..." : content[langChange("save")]}
            </MyButton>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default UserUpdatePage;
