"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCardOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleFilled,
  DownOutlined,
} from "@ant-design/icons";
import { Popconfirm, message } from "antd";
import Container from "../../components/ui/Container/Container";
import AddCardModal from "../../components/ui/AddCardModal/AddCardModal";
import s from "./UserPage.module.scss";
import { useLocalizedText } from "../../hook/useLocalizedText";
import moment from "moment";
import FT_API from "../../api/api";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import {
  fetchCards,
  deleteCard,
  type Card,
} from "../../store/cards/cardsSlice";
import {
  fetchMyBooks,
  fetchDownloadUrl,
  formatPrice,
  type UserBook,
} from "../../store/books/booksSlice";
import {
  fetchMySubscriptions,
  setAutoPay,
  computePlanPrice,
  type Subscription,
} from "../../store/subscriptions/subscriptionsSlice";
import {
  fetchWalletTransactions,
  formatAmount,
  type WalletTransaction,
} from "../../store/wallet/walletSlice";
import {
  BookOutlined,
  DownloadOutlined,
  CrownFilled,
  ReloadOutlined,
  CloseCircleFilled,
  ClockCircleFilled,
  HistoryOutlined,
} from "@ant-design/icons";
import { Switch } from "antd";
import { Link } from "@/lib/router-compat";

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
  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const content = {
    surname: "Familiya",
    surname_ru: "Фамилия",
    surname_en: "Last name",
    name: "Ism",
    name_ru: "Имя",
    name_en: "First name",
    phone: "Telefon",
    phone_ru: "Телефон",
    phone_en: "Phone",
    email: "Email",
    email_ru: "Email",
    email_en: "Email",
    was_born_date: "Tugʻilgan sana",
    was_born_date_ru: "Дата рождения",
    was_born_date_en: "Date of birth",
    avatar_url: "Rasm URL",
    avatar_url_ru: "URL фото",
    avatar_url_en: "Avatar URL",
    change: "Oʻzgartirish",
    change_ru: "Изменить",
    change_en: "Edit",
    not_set: "Kiritilmagan",
    not_set_ru: "Не указано",
    not_set_en: "Not set",
    profile_info: "Shaxsiy maʼlumotlar",
    profile_info_ru: "Личные данные",
    profile_info_en: "Personal info",
    verified: "Tasdiqlangan",
    verified_ru: "Подтверждён",
    verified_en: "Verified",
    member_since: "Roʻyxatdan o'tgan",
    member_since_ru: "С нами с",
    member_since_en: "Member since",
    edit_profile: "Profilni tahrirlash",
    edit_profile_ru: "Редактировать профиль",
    edit_profile_en: "Edit profile",
    save: "Saqlash",
    save_ru: "Сохранить",
    save_en: "Save",
    cancel: "Bekor qilish",
    cancel_ru: "Отмена",
    cancel_en: "Cancel",
    saving: "Saqlanmoqda...",
    saving_ru: "Сохранение...",
    saving_en: "Saving…",
    saved: "Saqlandi",
    saved_ru: "Сохранено",
    saved_en: "Saved",
    error: "Xatolik yuz berdi",
    error_ru: "Произошла ошибка",
    error_en: "Something went wrong",
    avatar_hint: "Rasm URL'ini kiriting (https://...)",
    avatar_hint_ru: "Введите URL изображения (https://...)",
    avatar_hint_en: "Enter image URL (https://…)",
  } as const;

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [booksExpanded, setBooksExpanded] = useState(false);
  const [subsExpanded, setSubsExpanded] = useState(false);
  const [txExpanded, setTxExpanded] = useState(false);

  const dispatch = useDispatch<any>();
  const [cardMessageApi, cardMessageHolder] = message.useMessage();
  const cards = useSelector(
    (state: any) => (state.cards?.list ?? []) as Card[]
  );
  const cardsLoading = useSelector(
    (state: any) => (state.cards?.loading ?? false) as boolean
  );

  const myBooks = useSelector(
    (state: any) => (state.books?.myBooks ?? []) as UserBook[]
  );
  const myBooksLoading = useSelector(
    (state: any) => (state.books?.myBooksLoading ?? false) as boolean
  );
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const subscriptions = useSelector(
    (state: any) => (state.subscriptions?.active ?? []) as Subscription[]
  );
  const subscriptionsLoading = useSelector(
    (state: any) => (state.subscriptions?.loading ?? false) as boolean
  );
  const subMutating = useSelector(
    (state: any) => (state.subscriptions?.mutating ?? false) as boolean
  );

  const transactions = useSelector(
    (state: any) => (state.wallet?.list ?? []) as WalletTransaction[]
  );
  const transactionsLoading = useSelector(
    (state: any) => (state.wallet?.loading ?? false) as boolean
  );

  useEffect(() => {
    dispatch(fetchCards());
    dispatch(fetchMyBooks());
    dispatch(fetchMySubscriptions());
    dispatch(fetchWalletTransactions({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleAutoPay = async (enabled: boolean, cardId?: number | null) => {
    try {
      await dispatch(
        setAutoPay({
          enabled,
          cardId: cardId ?? undefined,
        })
      ).unwrap();
      cardMessageApi.success(
        enabled
          ? t("Avto-toʻlov yoqildi", "Автооплата включена", "Auto-pay enabled")
          : t(
              "Avto-toʻlov oʻchirildi",
              "Автооплата отключена",
              "Auto-pay disabled"
            )
      );
    } catch (err: any) {
      cardMessageApi.error(err || "Xatolik");
    }
  };

  const handleDownload = async (bookId: number) => {
    setDownloadingId(bookId);
    try {
      const res = await dispatch(fetchDownloadUrl(bookId)).unwrap();
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      cardMessageApi.error(err || "Xatolik");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await dispatch(deleteCard(cardId)).unwrap();
      cardMessageApi.success(
        t("Karta oʻchirildi", "Карта удалена", "Card deleted")
      );
    } catch (err: any) {
      cardMessageApi.error(err || "Xatolik");
    }
  };

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
    // navigate from router-compat is recreated each render — intentionally
    // excluded from deps to avoid an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <title>Profil — Coach Hub</title>
        <meta
          name="description"
          content="Coach Hub shaxsiy profilingizni boshqaring: obuna, toʻlov tarixi, saqlangan kartalar va shaxsiy maʼlumotlar."
        />
        <link rel="canonical" href="https://coaching-center.uz/user" />
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

        {/* Cards */}
        {cardMessageHolder}
        <div className={s.cardsCard}>
          <div
            className={`${s.cardsHeader} ${s.cardsHeaderToggle}`}
            role="button"
            tabIndex={0}
            onClick={() => setCardsExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setCardsExpanded((v) => !v);
              }
            }}
          >
            <div className={s.cardsTitleGroup}>
              <CreditCardOutlined className={s.cardsHeaderIcon} />
              <div>
                <div className={s.infoTitle}>
                  {t("Bank kartalari", "Банковские карты", "Bank cards")}
                  <span className={s.cardsHeaderCount}>{cards.length}</span>
                </div>
                <div className={s.cardsSubtitle}>
                  {t(
                    "Toʻlov uchun saqlangan kartalar",
                    "Сохранённые карты для оплаты",
                    "Saved cards for payments"
                  )}
                </div>
              </div>
            </div>
            <div className={s.cardsHeaderActions}>
              <button
                type="button"
                className={s.addCardBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setAddCardOpen(true);
                }}
              >
                <PlusOutlined />
                {t("Qoʻshish", "Добавить", "Add")}
              </button>
              <span
                className={`${s.cardsChevron} ${cardsExpanded ? s.cardsChevronOpen : ""}`}
                aria-hidden="true"
              >
                <DownOutlined />
              </span>
            </div>
          </div>

          <div
            className={`${s.cardsCollapse} ${cardsExpanded ? s.cardsCollapseOpen : ""}`}
            aria-hidden={!cardsExpanded}
          >
            <div className={s.cardsCollapseInner}>
              {cardsLoading && cards.length === 0 ? (
                <div className={s.cardsEmpty}>
                  {t("Yuklanmoqda...", "Загрузка...", "Loading…")}
                </div>
              ) : cards.length === 0 ? (
            <div className={s.cardsEmpty}>
              <CreditCardOutlined className={s.cardsEmptyIcon} />
              <div className={s.cardsEmptyTitle}>
                {t(
                  "Kartalar qoʻshilmagan",
                  "Карты не добавлены",
                  "No cards added"
                )}
              </div>
              <div className={s.cardsEmptyText}>
                {t(
                  "Bir bosishda xarid qilish uchun karta qoʻshing",
                  "Добавьте карту чтобы оформлять покупки в один клик",
                  "Add a card to check out in one click"
                )}
              </div>
            </div>
          ) : (
            <div className={s.cardList}>
              {cards.map((c) => (
                <div key={c.id} className={s.cardItem}>
                  <div className={s.cardChip} />
                  <div className={s.cardBrand}>
                    {c.provider === "click" ? "CLICK" : c.provider}
                  </div>
                  <div className={s.cardNumber}>
                    {c.cardNumber ?? `•••• •••• •••• ${c.last4}`}
                  </div>
                  <div className={s.cardFooter}>
                    <div>
                      <div className={s.cardLabel}>
                        {t("Muddat", "Срок", "Expires")}
                      </div>
                      <div className={s.cardValue}>
                        {c.expireDate
                          ? `${c.expireDate.slice(0, 2)}/${c.expireDate.slice(2)}`
                          : "—"}
                      </div>
                    </div>
                    {c.phoneNumber && (
                      <div>
                        <div className={s.cardLabel}>
                          {t("Telefon", "Телефон", "Phone")}
                        </div>
                        <div className={s.cardValue}>{c.phoneNumber}</div>
                      </div>
                    )}
                    {c.isVerified && (
                      <span className={s.cardVerified}>
                        <CheckCircleFilled />
                      </span>
                    )}
                  </div>
                  <Popconfirm
                    title={t(
                      "Kartani oʻchirilsinmi?",
                      "Удалить карту?",
                      "Delete this card?"
                    )}
                    okText={t("Ha", "Да", "Yes")}
                    cancelText={t("Yoʻq", "Нет", "No")}
                    onConfirm={() => handleDeleteCard(c.id)}
                  >
                    <button
                      type="button"
                      className={s.cardDeleteBtn}
                      aria-label="Delete card"
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>

        {/* My Books */}
        <div className={s.cardsCard}>
          <div
            className={`${s.cardsHeader} ${s.cardsHeaderToggle}`}
            role="button"
            tabIndex={0}
            onClick={() => setBooksExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setBooksExpanded((v) => !v);
              }
            }}
          >
            <div className={s.cardsTitleGroup}>
              <BookOutlined className={s.cardsHeaderIcon} />
              <div>
                <div className={s.infoTitle}>
                  {t("Mening kitoblarim", "Мои книги", "My books")}
                  <span className={s.cardsHeaderCount}>
                    {myBooks.length}
                  </span>
                </div>
                <div className={s.cardsSubtitle}>
                  {t(
                    "Sotib olingan va qabul qilingan materiallar",
                    "Купленные и полученные материалы",
                    "Purchased and received materials"
                  )}
                </div>
              </div>
            </div>
            <span
              className={`${s.cardsChevron} ${booksExpanded ? s.cardsChevronOpen : ""}`}
              aria-hidden="true"
            >
              <DownOutlined />
            </span>
          </div>

          <div
            className={`${s.cardsCollapse} ${booksExpanded ? s.cardsCollapseOpen : ""}`}
            aria-hidden={!booksExpanded}
          >
            <div className={s.cardsCollapseInner}>
              {myBooksLoading && myBooks.length === 0 ? (
            <div className={s.cardsEmpty}>
              {t("Yuklanmoqda...", "Загрузка...", "Loading…")}
            </div>
          ) : myBooks.length === 0 ? (
            <div className={s.cardsEmpty}>
              <BookOutlined className={s.cardsEmptyIcon} />
              <div className={s.cardsEmptyTitle}>
                {t(
                  "Kitoblar sotib olinmagan",
                  "Книги не куплены",
                  "No purchased books"
                )}
              </div>
              <div className={s.cardsEmptyText}>
                {t(
                  "Kutubxonadan qiziqarli materiallar tanlang",
                  "Откройте библиотеку и найдите интересные материалы",
                  "Open the library and discover useful materials"
                )}
              </div>
              <Link to="/books" className={s.subSubscribeBtn}>
                {t(
                  "Kutubxonani ochish",
                  "Открыть библиотеку",
                  "Open library"
                )}
              </Link>
            </div>
          ) : (
            <div className={s.myBooksList}>
              {myBooks.slice(0, 3).map((ub) => {
                const title =
                  lang === "ru" ? ub.book?.titleRu : ub.book?.titleUz;
                const cover = ub.book?.coverImageUrl;
                const isUrl =
                  typeof cover === "string" &&
                  (cover.startsWith("http://") ||
                    cover.startsWith("https://"));
                const acquired = moment(ub.acquiredAt).isValid()
                  ? moment(ub.acquiredAt).format("DD MMM YYYY")
                  : "";
                return (
                  <div key={ub.id} className={s.myBookItem}>
                    <Link
                      to={`/books/${ub.bookId}`}
                      className={s.myBookCover}
                      style={
                        isUrl
                          ? { backgroundImage: `url("${cover}")` }
                          : undefined
                      }
                    >
                      {!isUrl && <BookOutlined />}
                    </Link>
                    <div className={s.myBookBody}>
                      <Link
                        to={`/books/${ub.bookId}`}
                        className={s.myBookTitle}
                      >
                        {title || "—"}
                      </Link>
                      <div className={s.myBookMeta}>
                        {acquired && (
                          <span>
                            {t(
                              "Sotib olingan: ",
                              "Куплено: ",
                              "Purchased: "
                            )}
                            <strong>{acquired}</strong>
                          </span>
                        )}
                        {ub.transactionId == null && (
                          <span className={s.myBookFreeBadge}>
                            {t("Bepul", "Бесплатно", "Free")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={s.myBookDownload}
                      disabled={downloadingId === ub.bookId}
                      onClick={() => handleDownload(ub.bookId)}
                    >
                      <DownloadOutlined />
                      {downloadingId === ub.bookId
                        ? "..."
                        : t("Yuklab olish", "Скачать", "Download")}
                    </button>
                  </div>
                );
              })}
              {myBooks.length > 0 && (
                <Link to="/me/books" className={s.viewAllLink}>
                  {t(
                    `Batafsil koʻrish${myBooks.length > 3 ? ` (${myBooks.length})` : ""}`,
                    `Подробнее${myBooks.length > 3 ? ` (${myBooks.length})` : ""}`,
                    `View all${myBooks.length > 3 ? ` (${myBooks.length})` : ""}`
                  )}
                </Link>
              )}
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className={s.cardsCard}>
          <div
            className={`${s.cardsHeader} ${s.cardsHeaderToggle}`}
            role="button"
            tabIndex={0}
            onClick={() => setSubsExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSubsExpanded((v) => !v);
              }
            }}
          >
            <div className={s.cardsTitleGroup}>
              <CrownFilled className={s.cardsHeaderIcon} />
              <div>
                <div className={s.infoTitle}>
                  {t("Obuna", "Подписка", "Subscription")}
                  <span className={s.cardsHeaderCount}>
                    {subscriptions.length}
                  </span>
                </div>
                <div className={s.cardsSubtitle}>
                  {t(
                    "Faol tarif va avto-toʻlov",
                    "Активный тариф и автооплата",
                    "Active plan and auto-pay"
                  )}
                </div>
              </div>
            </div>
            <span
              className={`${s.cardsChevron} ${subsExpanded ? s.cardsChevronOpen : ""}`}
              aria-hidden="true"
            >
              <DownOutlined />
            </span>
          </div>

          <div
            className={`${s.cardsCollapse} ${subsExpanded ? s.cardsCollapseOpen : ""}`}
            aria-hidden={!subsExpanded}
          >
            <div className={s.cardsCollapseInner}>
              {subscriptionsLoading && subscriptions.length === 0 ? (
            <div className={s.cardsEmpty}>
              {t("Yuklanmoqda...", "Загрузка...", "Loading…")}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className={s.cardsEmpty}>
              <CrownFilled className={s.cardsEmptyIcon} />
              <div className={s.cardsEmptyTitle}>
                {t(
                  "Faol obuna yoʻq",
                  "Подписка не активна",
                  "No active subscription"
                )}
              </div>
              <div className={s.cardsEmptyText}>
                {t(
                  "Toʻliq kirish uchun obuna oling",
                  "Оформите подписку чтобы открыть полный доступ",
                  "Subscribe to unlock full access"
                )}
              </div>
              <Link to="/subscriptions" className={s.subSubscribeBtn}>
                {t("Tarif tanlash", "Выбрать тариф", "Choose a plan")}
              </Link>
            </div>
          ) : (
            <div className={s.subList}>
              {subscriptions.slice(0, 3).map((sub) => {
                const planTitle =
                  lang === "ru"
                    ? sub.subscriptionsPlan?.titleRu
                    : sub.subscriptionsPlan?.titleUz;
                const endDate = moment(sub.endDate);
                const daysLeft = endDate.isValid()
                  ? endDate.diff(moment(), "days")
                  : 0;
                const price = sub.subscriptionsPlan
                  ? computePlanPrice(sub.subscriptionsPlan)
                  : 0;

                return (
                  <div key={sub.id} className={s.subItem}>
                    <div className={s.subBadge}>
                      <CrownFilled />
                    </div>
                    <div className={s.subBody}>
                      <div className={s.subPlanName}>{planTitle || "—"}</div>
                      <div className={s.subMeta}>
                        <span>
                          {t("Tugashi", "До", "Ends")}
                          :{" "}
                          <strong>{endDate.format("DD MMM YYYY")}</strong>
                        </span>
                        <span className={s.subDot} />
                        <span
                          className={
                            daysLeft <= 3 ? s.subDaysWarn : s.subDays
                          }
                        >
                          {daysLeft > 0
                            ? t(
                                `${daysLeft} kun qoldi`,
                                `Осталось ${daysLeft} дн.`,
                                `${daysLeft} day(s) left`
                              )
                            : t(
                                "Bugun tugaydi",
                                "Истекает сегодня",
                                "Expires today"
                              )}
                        </span>
                      </div>
                      <div className={s.subPrice}>
                        {formatAmount(price)} soʻm /{" "}
                        {sub.subscriptionsPlan?.durationDays}{" "}
                        {t("kun", "дн.", "days")}
                      </div>
                    </div>

                    <div className={s.subAutoPayWrap}>
                      <span className={s.subAutoPayLabel}>
                        <ReloadOutlined />
                        {t("Avto-toʻlov", "Авто-оплата", "Auto-pay")}
                      </span>
                      <Switch
                        checked={sub.autoPay}
                        loading={subMutating}
                        onChange={(checked) =>
                          handleAutoPay(checked, sub.cardId)
                        }
                      />
                    </div>
                  </div>
                );
              })}
              <Link to="/me/subscriptions" className={s.viewAllLink}>
                {t(
                  "Obunalar tarixi",
                  "История подписок",
                  "Subscription history"
                )}
              </Link>
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className={s.cardsCard}>
          <div
            className={`${s.cardsHeader} ${s.cardsHeaderToggle}`}
            role="button"
            tabIndex={0}
            onClick={() => setTxExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTxExpanded((v) => !v);
              }
            }}
          >
            <div className={s.cardsTitleGroup}>
              <HistoryOutlined className={s.cardsHeaderIcon} />
              <div>
                <div className={s.infoTitle}>
                  {t("Toʻlov tarixi", "История платежей", "Payment history")}
                  <span className={s.cardsHeaderCount}>
                    {transactions.length}
                  </span>
                </div>
                <div className={s.cardsSubtitle}>
                  {t(
                    "Barcha tranzaksiyalaringiz",
                    "Все ваши транзакции",
                    "All your transactions"
                  )}
                </div>
              </div>
            </div>
            <span
              className={`${s.cardsChevron} ${txExpanded ? s.cardsChevronOpen : ""}`}
              aria-hidden="true"
            >
              <DownOutlined />
            </span>
          </div>

          <div
            className={`${s.cardsCollapse} ${txExpanded ? s.cardsCollapseOpen : ""}`}
            aria-hidden={!txExpanded}
          >
            <div className={s.cardsCollapseInner}>
              {transactionsLoading && transactions.length === 0 ? (
            <div className={s.cardsEmpty}>
              {t("Yuklanmoqda...", "Загрузка...", "Loading…")}
            </div>
          ) : transactions.length === 0 ? (
            <div className={s.cardsEmpty}>
              <HistoryOutlined className={s.cardsEmptyIcon} />
              <div className={s.cardsEmptyTitle}>
                {t(
                  "Tranzaksiyalar yoʻq",
                  "Транзакций нет",
                  "No transactions"
                )}
              </div>
            </div>
          ) : (
            <div className={s.txList}>
              {transactions.slice(0, 3).map((tx) => {
                const created = moment(tx.createdAt).isValid()
                  ? moment(tx.createdAt).format("DD MMM YYYY, HH:mm")
                  : "";
                const isSuccess = tx.status === "SUCCESS";
                const isFailed = tx.status === "FAILED";
                const label = tx.subscriptionsPlansId
                  ? t("Obuna", "Подписка", "Subscription")
                  : t("Kitob", "Книга", "Book");

                return (
                  <div key={tx.id} className={s.txItem}>
                    <div
                      className={`${s.txStatusIcon} ${
                        isSuccess
                          ? s.txOk
                          : isFailed
                            ? s.txFail
                            : s.txPending
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircleFilled />
                      ) : isFailed ? (
                        <CloseCircleFilled />
                      ) : (
                        <ClockCircleFilled />
                      )}
                    </div>
                    <div className={s.txBody}>
                      <div className={s.txTopRow}>
                        <span className={s.txLabel}>{label}</span>
                        {tx.provider && (
                          <span className={s.txProvider}>
                            {tx.provider.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={s.txDate}>{created}</div>
                      {tx.errorMessage && (
                        <div className={s.txError}>{tx.errorMessage}</div>
                      )}
                    </div>
                    <div
                      className={`${s.txAmount} ${
                        isFailed ? s.txAmountFail : ""
                      }`}
                    >
                      {isFailed ? "—" : `${formatAmount(tx.amount)} soʻm`}
                    </div>
                  </div>
                );
              })}
              {transactions.length > 0 && (
                <Link to="/me/transactions" className={s.viewAllLink}>
                  {t(
                    `Batafsil koʻrish${transactions.length > 3 ? ` (${transactions.length})` : ""}`,
                    `Подробнее${transactions.length > 3 ? ` (${transactions.length})` : ""}`,
                    `View all${transactions.length > 3 ? ` (${transactions.length})` : ""}`
                  )}
                </Link>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      <AddCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
      />

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
