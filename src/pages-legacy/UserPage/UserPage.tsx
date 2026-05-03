"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Container from "../../components/ui/Container/Container";
import s from "./UserPage.module.scss";
import { useLocalizedText } from "../../hook/useLocalizedText";
import moment from "moment";
import FT_API from "../../api/api";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";

type ApiUser = {
  id: number;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  role?: { id: number; name: string };
  createdAt?: string;
};

const isPlaceholderPhone = (phone?: string | null) =>
  !!phone && (phone.startsWith("google_") || phone.startsWith("unset_"));

const formatBirthDate = (raw?: string | null) => {
  if (!raw) return null;
  const m = moment(raw);
  return m.isValid() ? m.format("DD MMMM YYYY") : null;
};

const formatJoined = (raw?: string | null) => {
  if (!raw) return null;
  const m = moment(raw);
  return m.isValid() ? m.format("MMMM YYYY") : null;
};

const initials = (first?: string | null, last?: string | null, email?: string | null) => {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  if (a || b) return (a + b).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
};

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
    was_born_date: "Tug'ilgan sana",
    was_born_date_ru: "Дата рождения",
    avatar_url: "Rasm URL",
    avatar_url_ru: "URL фото",
    change: "O'zgartirish",
    change_ru: "Изменить",
    not_set: "Kiritilmagan",
    not_set_ru: "Не указано",
    profile_info: "Shaxsiy ma'lumotlar",
    profile_info_ru: "Личные данные",
    verified: "Tasdiqlangan",
    verified_ru: "Подтверждён",
    member_since: "Ro'yxatdan o'tgan",
    member_since_ru: "С нами с",
    edit_profile: "Profilni tahrirlash",
    edit_profile_ru: "Редактировать профиль",
    save: "Saqlash",
    save_ru: "Сохранить",
    cancel: "Bekor qilish",
    cancel_ru: "Отмена",
    saving: "Saqlanmoqda...",
    saving_ru: "Сохранение...",
    saved: "Saqlandi",
    saved_ru: "Сохранено",
    error: "Xatolik yuz berdi",
    error_ru: "Произошла ошибка",
    avatar_hint: "Rasm URL'ini kiriting (https://...)",
    avatar_hint_ru: "Введите URL изображения (https://...)",
  } as const;

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await FT_API.get("/users/me");
        const payload = res.data?.data ?? res.data;
        if (!cancelled) setUser(payload as ApiUser);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 400) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          navigate("/login");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const fullName = useMemo(() => {
    const fn = (user?.firstName ?? "").trim();
    const ln = (user?.lastName ?? "").trim();
    return [fn, ln].filter(Boolean).join(" ") || (user?.email ?? "");
  }, [user]);

  const phoneDisplay = isPlaceholderPhone(user?.phone) ? null : user?.phone;
  const birthDateDisplay = formatBirthDate(user?.birthDate);
  const joinedDisplay = formatJoined(user?.createdAt);

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

      <div className={s.wrap}>
        {/* Hero */}
        <div className={s.hero}>
          <div className={s.avatar}>
            {user?.avatarUrl && !imgFailed ? (
              <img
                src={user.avatarUrl}
                alt={fullName || "avatar"}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className={s.avatarFallback}>
                {loading ? "" : initials(user?.firstName, user?.lastName, user?.email)}
              </span>
            )}
          </div>

          <div className={s.heroBody}>
            <div className={s.fullName}>
              {loading ? (
                <span
                  className={s.skeleton}
                  style={{ display: "inline-block", width: 200, height: 28 }}
                />
              ) : (
                fullName || "—"
              )}
            </div>
            <div className={s.subtitle}>
              {user?.email && <span>{user.email}</span>}
              {joinedDisplay && (
                <>
                  <span className={s.dot} />
                  <span>
                    {content[langChange("member_since")]} {joinedDisplay}
                  </span>
                </>
              )}
            </div>
            <div className={s.badges}>
              {user?.role?.name && (
                <span className={`${s.badge} ${s.badgeRole}`}>{user.role.name}</span>
              )}
              {user?.isVerified && (
                <span className={`${s.badge} ${s.badgeVerified}`}>
                  ✓ {content[langChange("verified")]}
                </span>
              )}
            </div>
          </div>

          <div className={s.editBtnWrap}>
            <button
              type="button"
              className={s.editBtn}
              onClick={() => setEditOpen(true)}
              disabled={loading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {content[langChange("change")]}
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className={s.infoCard}>
          <div className={s.infoTitle}>{content[langChange("profile_info")]}</div>

          <div className={s.infoGrid}>
            <InfoItem
              label={content[langChange("name")]}
              value={user?.firstName}
              fallback={content[langChange("not_set")]}
              loading={loading}
            />
            <InfoItem
              label={content[langChange("surname")]}
              value={user?.lastName}
              fallback={content[langChange("not_set")]}
              loading={loading}
            />
            <InfoItem
              label={content[langChange("email")]}
              value={user?.email}
              fallback={content[langChange("not_set")]}
              loading={loading}
            />
            <InfoItem
              label={content[langChange("phone")]}
              value={phoneDisplay}
              fallback={content[langChange("not_set")]}
              loading={loading}
            />
            <InfoItem
              label={content[langChange("was_born_date")]}
              value={birthDateDisplay}
              fallback={content[langChange("not_set")]}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {editOpen && user && (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(u) => {
            setUser(u);
            setImgFailed(false);
            setEditOpen(false);
          }}
          labels={{
            title: content[langChange("edit_profile")],
            firstName: content[langChange("name")],
            lastName: content[langChange("surname")],
            email: content[langChange("email")],
            phone: content[langChange("phone")],
            birthDate: content[langChange("was_born_date")],
            avatarUrl: content[langChange("avatar_url")],
            avatarHint: content[langChange("avatar_hint")],
            save: content[langChange("save")],
            saving: content[langChange("saving")],
            saved: content[langChange("saved")],
            cancel: content[langChange("cancel")],
            error: content[langChange("error")],
          }}
        />
      )}
    </Container>
  );
};

function InfoItem({
  label,
  value,
  fallback,
  loading,
}: {
  label: string;
  value?: string | null;
  fallback: string;
  loading: boolean;
}) {
  const display = value && value.trim() !== "" ? value : null;
  return (
    <div className={s.infoItem}>
      <span className={s.infoLabel}>{label}</span>
      <span className={`${s.infoValue} ${!display ? s.muted : ""}`}>
        {loading ? (
          <span
            className={s.skeleton}
            style={{ display: "inline-block", width: 140, height: 18 }}
          />
        ) : (
          display ?? fallback
        )}
      </span>
    </div>
  );
}

// ─── Edit Profile Modal ────────────────────────────────────────────────
function EditProfileModal({
  user,
  onClose,
  onSaved,
  labels,
}: {
  user: ApiUser;
  onClose: () => void;
  onSaved: (u: ApiUser) => void;
  labels: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    avatarUrl: string;
    avatarHint: string;
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    error: string;
  };
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [birthDate, setBirthDate] = useState(
    user.birthDate ? moment(user.birthDate).format("YYYY-MM-DD") : "",
  );
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setFeedback({ type: "err", text: "Faqat JPEG / PNG / WebP / GIF" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "err", text: "Maksimum 5 MB" });
      return;
    }
    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await FT_API.post("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated: ApiUser = res.data?.data ?? res.data;
      setAvatarUrl(updated.avatarUrl ?? "");
      setPreviewFailed(false);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || labels.error;
      setFeedback({ type: "err", text: msg });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const res = await FT_API.delete("/users/me/avatar");
      const updated: ApiUser = res.data?.data ?? res.data;
      setAvatarUrl(updated.avatarUrl ?? "");
      setPreviewFailed(false);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || labels.error;
      setFeedback({ type: "err", text: msg });
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ESC closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const payload: Record<string, unknown> = {};
    if (firstName !== (user.firstName ?? "")) payload.firstName = firstName;
    if (lastName !== (user.lastName ?? "")) payload.lastName = lastName;

    const newDateIso = birthDate ? new Date(birthDate).toISOString() : null;
    const oldDateIso = user.birthDate ?? null;
    if (newDateIso !== oldDateIso) payload.birthDate = newDateIso;

    // If nothing to update on profile but avatar already uploaded, just close.
    if (Object.keys(payload).length === 0) {
      onSaved({ ...user, avatarUrl });
      return;
    }

    try {
      const res = await FT_API.patch("/users/me", payload);
      const updated: ApiUser = res.data?.data ?? res.data;
      setFeedback({ type: "ok", text: labels.saved });
      setTimeout(() => onSaved(updated), 500);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || labels.error;
      setFeedback({ type: "err", text: msg });
      setSubmitting(false);
    }
  }

  const previewInitials = initials(firstName, lastName, user.email);

  // When closing, propagate any avatar change uploaded outside the form save.
  const closeWithLatest = () => {
    if (submitting || uploadingAvatar) return;
    if ((user.avatarUrl ?? "") !== avatarUrl) {
      onSaved({ ...user, avatarUrl: avatarUrl || null });
    } else {
      onClose();
    }
  };

  return (
    <div
      className={s.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWithLatest();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{labels.title}</div>
          <button
            type="button"
            className={s.modalClose}
            onClick={closeWithLatest}
            aria-label="close"
            disabled={submitting || uploadingAvatar}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className={s.modalBody}>
            {/* Avatar uploader */}
            <div className={s.modalAvatar}>
              <div className={s.modalAvatarImg}>
                {uploadingAvatar ? (
                  <div className={s.spinner} />
                ) : avatarUrl && !previewFailed ? (
                  <img
                    src={avatarUrl}
                    alt="preview"
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewFailed(true)}
                  />
                ) : (
                  <span>{previewInitials}</span>
                )}
              </div>
              <div className={s.avatarActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className={s.avatarBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar || submitting}
                >
                  {avatarUrl ? "Almashtirish" : "Yuklash"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className={s.avatarBtnGhost}
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar || submitting}
                  >
                    O&apos;chirish
                  </button>
                )}
                <div className={s.avatarTinyHint}>JPEG / PNG / WebP / GIF, max 5 MB</div>
              </div>
            </div>

            <div className={s.fieldRow}>
              <div className={s.field}>
                <label className={s.fieldLabel}>{labels.firstName}</label>
                <input
                  className={s.input}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={labels.firstName}
                />
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel}>{labels.lastName}</label>
                <input
                  className={s.input}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={labels.lastName}
                />
              </div>
            </div>

            {user.email && (
              <div className={s.field}>
                <label className={s.fieldLabel}>{labels.email}</label>
                <input
                  className={s.input}
                  value={user.email}
                  disabled
                />
              </div>
            )}

            {!isPlaceholderPhone(user.phone) && user.phone && (
              <div className={s.field}>
                <label className={s.fieldLabel}>{labels.phone}</label>
                <input
                  className={s.input}
                  value={user.phone}
                  disabled
                />
              </div>
            )}

            <div className={s.field}>
              <label className={s.fieldLabel}>{labels.birthDate}</label>
              <input
                type="date"
                className={s.input}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            {feedback && (
              <div className={feedback.type === "ok" ? s.feedbackOk : s.feedbackErr}>
                {feedback.type === "ok" ? "✓" : "✕"} {feedback.text}
              </div>
            )}
          </div>

          <div className={s.modalFooter}>
            <button
              type="button"
              className={s.btnGhost}
              onClick={closeWithLatest}
              disabled={submitting || uploadingAvatar}
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              className={s.btnPrimary}
              disabled={submitting || uploadingAvatar}
            >
              {submitting ? labels.saving : labels.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserPage;
