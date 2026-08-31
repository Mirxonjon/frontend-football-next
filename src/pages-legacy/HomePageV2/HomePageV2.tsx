"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PlayCircleFilled,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  CrownOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  GiftOutlined,
  RocketOutlined,
  TeamOutlined,
  ReadOutlined,
  StarFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";

import dynamic from "next/dynamic";
import { Link } from "@/lib/router-compat";
import { useReveal } from "../../hook/useReveal";
import LazyHeroVideo from "../../components/ui/LazyHeroVideo/LazyHeroVideo";
import ContinueWatching from "../../components/ui/ContinueWatching/ContinueWatching";

// Footer is below the fold — split it into its own chunk so it doesn't
// inflate the initial JS bundle.
const Footer = dynamic(() => import("../../components/ui/Footer/Footer"), {
  ssr: false,
  loading: () => null,
});

import {
  fetchTrainingCategories,
  type TrainingCategory,
} from "../../store/trening/treningCategoriesSlice";
import {
  fetchBooks,
  computeDisplayPrice,
  hasDiscount,
  formatPrice,
  type Book,
} from "../../store/books/booksSlice";
import {
  fetchPlans,
  calcFinalPrice,
  planHasDiscount,
  discountPercentValue,
  planTitle as planTitleFn,
  featureText,
  formatPrice as formatPlanPrice,
  durationLabel,
  type SubscriptionPlan,
} from "../../store/plans/plansSlice";
import {
  fetchMasterclasses,
  type Masterclass,
} from "../../store/masterclass/masterclassSlice";

import s from "./HomePageV2.module.scss";

/* ───────── animated count-up ───────── */
const CountUp = ({
  value,
  suffix = "+",
  duration = 1400,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf: number | null = null;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setN(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        if (raf) cancelAnimationFrame(raf);
      };
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => {
      obs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
};

const FALLBACK_BG =
  "linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)";

type Testimonial = {
  id: number;
  nameUz: string;
  nameRu: string;
  roleUz: string;
  roleRu: string;
  quoteUz: string;
  quoteRu: string;
  rating: number; // 1..5
  avatarBg: string; // gradient
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    nameUz: "Sardor Aliyev",
    nameRu: "Сардор Алиев",
    roleUz: "Bolalar futbol murabbiysi, Toshkent",
    roleRu: "Детский футбольный тренер, Ташкент",
    quoteUz:
      "Bepul darslardan boshladim, keyin obuna boʻldim. Endi har hafta yangi mashgʻulotlarni oʻzimning komandam bilan ishlatyapman.",
    quoteRu:
      "Начал с бесплатных уроков, потом оформил подписку. Теперь каждую неделю применяю новые тренировки со своей командой.",
    rating: 5,
    avatarBg: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
  },
  {
    id: 2,
    nameUz: "Dilshod Karimov",
    nameRu: "Дильшод Каримов",
    roleUz: "U-15 jamoasi murabbiysi",
    roleRu: "Тренер команды U-15",
    quoteUz:
      "Masterclasslar juda chuqur tushuntirilgan. Taktika qismida koʻp narsa oʻrgandim. Oʻzbek tilida boʻlishi katta yutuq.",
    quoteRu:
      "Мастер-классы очень глубоко поданы. Особенно тактический блок — много нового. И главное — на узбекском языке.",
    rating: 5,
    avatarBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  {
    id: 3,
    nameUz: "Munira Yusupova",
    nameRu: "Мунира Юсупова",
    roleUz: "Akademiya murabbiysi, Samarqand",
    roleRu: "Тренер академии, Самарканд",
    quoteUz:
      "Kutubxonadagi konspektlar juda foydali. Mashgʻulot rejasi tuzishda menga vaqtni 2 barobar tejaydi.",
    quoteRu:
      "Конспекты в библиотеке очень полезные. Сэкономили мне в 2 раза больше времени при подготовке плана.",
    rating: 5,
    avatarBg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    id: 4,
    nameUz: "Jasur Nazarov",
    nameRu: "Жасур Назаров",
    roleUz: "Yosh oʻyinchi, 17 yosh",
    roleRu: "Молодой игрок, 17 лет",
    quoteUz:
      "Yakkama-yakka mashgʻulotlar orqali oʻzimni rivojlantiryapman. Hatto bepul qismda ham juda koʻp narsa bor.",
    quoteRu:
      "Развиваюсь с помощью индивидуальных тренировок. Даже в бесплатной части много полезного контента.",
    rating: 4,
    avatarBg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  },
  {
    id: 5,
    nameUz: "Bekzod Tursunov",
    nameRu: "Бекзод Турсунов",
    roleUz: "Maktab futbol murabbiysi",
    roleRu: "Школьный футбольный тренер",
    quoteUz:
      "Ilova juda qulay. Telefon orqali ishlatish oson, video sifatida juda yaxshi.",
    quoteRu:
      "Платформа очень удобная. Через телефон работать легко, качество видео отличное.",
    rating: 5,
    avatarBg: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  },
  {
    id: 6,
    nameUz: "Aziza Rahimova",
    nameRu: "Азиза Рахимова",
    roleUz: "Xotin-qizlar futboli murabbiysi",
    roleRu: "Тренер женского футбола",
    quoteUz:
      "Ayol murabbiy sifatida shu platformada oʻzimga mos materiallarni topdim. Kategoriyalar yaxshi tashkil qilingan.",
    quoteRu:
      "Как женщина-тренер, нашла здесь подходящие материалы. Категории отлично организованы.",
    rating: 5,
    avatarBg: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  },
];

const HomePageV2 = () => {
  const dispatch = useDispatch<any>();
  const lang = useSelector(
    (state: any) => state.lang.lang
  ) as "uz" | "ru" | "en";
  // For data fields (titleUz/titleRu) — backend lacks _En, fall back to UZ.
  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  // For UI labels with English support.
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  // Select the raw arrays only — slicing here would return a new reference
  // every render and trigger react-redux's "selector returned a new value"
  // warning. We slice in a `useMemo` below.
  const trainingsAll = useSelector(
    (state: any) =>
      (state.treningCategory?.items ?? []) as TrainingCategory[]
  );
  const trainings = useMemo(
    () => trainingsAll.slice(0, 6),
    [trainingsAll]
  );
  const booksAll = useSelector(
    (state: any) => (state.books?.items ?? []) as Book[]
  );
  const books = useMemo(() => booksAll.slice(0, 4), [booksAll]);
  const plans = useSelector(
    (state: any) => (state.plans?.list ?? []) as SubscriptionPlan[]
  );
  const plansLoading = useSelector(
    (state: any) => (state.plans?.loading ?? false) as boolean
  );
  const masterclassesAll = useSelector(
    (state: any) => (state.masterclass?.list ?? []) as Masterclass[]
  );
  const masterclasses = useMemo(
    () => masterclassesAll.slice(0, 6),
    [masterclassesAll]
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("home-v2-active");
      return () => {
        document.documentElement.classList.remove("home-v2-active");
      };
    }
  }, []);

  useEffect(() => {
    dispatch(
      fetchTrainingCategories({
        limit: 6,
        sortBy: "createdAt",
        sortOrder: "desc",
      } as any)
    );
    dispatch(
      fetchBooks({
        limit: 4,
        sortBy: "createdAt",
        sortOrder: "desc",
      } as any)
    );
    dispatch(fetchPlans());
    dispatch(
      fetchMasterclasses({
        limit: 6,
        sortBy: "createdAt",
        sortOrder: "desc",
      } as any)
    );
  }, [dispatch]);

  const recommendedPlanId = plans.reduce<number | null>((best, p) => {
    if (best === null) return p.id;
    const bestPlan = plans.find((x) => x.id === best);
    if (!bestPlan) return p.id;
    return p.durationDays > bestPlan.durationDays ? p.id : best;
  }, null);

  const isUrl = (u?: string | null): u is string =>
    typeof u === "string" &&
    (u.startsWith("http://") || u.startsWith("https://"));

  const trustReveal = useReveal<HTMLElement>();
  const trainReveal = useReveal<HTMLElement>();
  const booksReveal = useReveal<HTMLElement>();
  const mcReveal = useReveal<HTMLElement>();
  const plansReveal = useReveal<HTMLElement>();
  const stepsReveal = useReveal<HTMLElement>();
  const tReveal = useReveal<HTMLElement>();
  const finalReveal = useReveal<HTMLElement>();

  // Plans carousel — show N at a time on desktop / tablet / phone.
  // Advance by ONE card per click, animated via CSS translateX track.
  const [plansPerPage, setPlansPerPage] = useState(3);
  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return 3;
      const w = window.innerWidth;
      if (w < 600) return 1;
      if (w < 1100) return 2;
      return 3;
    };
    setPlansPerPage(compute());
    const onResize = () => setPlansPerPage(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [planStart, setPlanStart] = useState(0);
  // How many "steps" the user can advance through (one step = one card shift).
  const planMaxStart = Math.max(0, plans.length - plansPerPage);
  // Clamp on resize / list shrink.
  useEffect(() => {
    if (planStart > planMaxStart) setPlanStart(planMaxStart);
  }, [planMaxStart, planStart]);

  return (
    <>
      <div className={s.pageWrap}>
        {/* ─────────── 1. HERO ─────────── */}
        <section className={s.hero}>
          <span className={`${s.heroOrb} ${s.heroOrbA}`} aria-hidden="true" />
          <span className={`${s.heroOrb} ${s.heroOrbB}`} aria-hidden="true" />
          <div className={`${s.heroContent} ${s.fadeUp}`}>
            <div className={s.heroBadge}>
              <GiftOutlined />
              {t(
                "Bepul darslar barchaga ochiq",
                "Бесплатные уроки доступны всем",
                "Free lessons open to everyone"
              )}
            </div>

            <h1 className={s.heroTitle}>
              {lang === "ru" ? (
                <>
                  Учитесь у лучших <br />
                  <span className={s.heroTitleAccent}>
                    футбольных тренеров
                  </span>
                </>
              ) : lang === "en" ? (
                <>
                  Learn from the best <br />
                  <span className={s.heroTitleAccent}>
                    football coaches
                  </span>
                </>
              ) : (
                <>
                  Eng yaxshi futbol <br />
                  <span className={s.heroTitleAccent}>
                    murabbiylaridan oʻrganing
                  </span>
                </>
              )}
            </h1>

            <p className={s.heroSubtitle}>
              {t(
                "Mashgʻulotlar, masterclasslar va kitoblar — murabbiy va oʻyinchilar uchun. Bepul boshlang, hech qanday majburiyatsiz.",
                "Тренировки, мастер-классы и книги для тренеров и игроков. Начните бесплатно — без обязательств.",
                "Trainings, masterclasses and books — for coaches and players. Start free, no commitments."
              )}
            </p>

            <div className={s.heroActions}>
              <Link to="/training" className={s.heroBtnPrimary}>
                <PlayCircleFilled />
                {t(
                  "Bepul koʻrishni boshlash",
                  "Смотреть бесплатно",
                  "Watch for free"
                )}
              </Link>
              <Link to="/register" className={s.heroBtnGhost}>
                {t("Akkaunt yaratish", "Создать аккаунт", "Create account")}
                <ArrowRightOutlined />
              </Link>
            </div>

            <ul className={s.heroBullets}>
              <li>
                <CheckCircleFilled />
                {t(
                  "Roʻyxatdan oʻtish bepul",
                  "Регистрация бесплатна",
                  "Sign up is free"
                )}
              </li>
              <li>
                <CheckCircleFilled />
                {t(
                  "Bir qator materiallar obunasiz ochiq",
                  "Часть материалов открыта без подписки",
                  "Many materials are free without a subscription"
                )}
              </li>
              <li>
                <CheckCircleFilled />
                {t(
                  "Obuna istalgan vaqt bekor qilinadi",
                  "Отмена подписки в один клик",
                  "Cancel anytime in one click"
                )}
              </li>
            </ul>
          </div>

          <div className={`${s.heroMedia} ${s.fadeUpDelay}`}>
            <LazyHeroVideo
              className={s.heroVideo}
              src="https://minio.coaching-center.uz/coaching-site/hero.mp4"
              width={1280}
              height={720}
              ariaLabel={t(
                "Futbol mashgʻuloti namoyishi",
                "Демонстрация футбольной тренировки",
                "Football training demo"
              )}
            />
            <div className={s.heroFloatCard}>
              <ThunderboltFilled />
              <div>
                <div className={s.heroFloatTitle}>
                  {t(
                    "20+ masterclass",
                    "20+ мастер-классов",
                    "20+ masterclasses"
                  )}
                </div>
                <div className={s.heroFloatMeta}>
                  {t(
                    "yetakchi murabbiylardan",
                    "от ведущих тренеров",
                    "from top coaches"
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── 2. TRUST STRIP ─────────── */}
        <section
          ref={trustReveal.ref}
          className={`${s.trustStrip} ${s.reveal} ${
            trustReveal.revealed ? s.revealed : ""
          }`}
        >
          <div className={s.trustItem} style={{ ["--i" as any]: 0 }}>
            <TeamOutlined />
            <div>
              <strong>
                <CountUp value={5000} />
              </strong>
              <span>
                {t(
                  "murabbiy va oʻyinchi",
                  "тренеров и игроков",
                  "coaches & players"
                )}
              </span>
            </div>
          </div>
          <div className={s.trustItem} style={{ ["--i" as any]: 1 }}>
            <PlayCircleFilled />
            <div>
              <strong>
                <CountUp value={100} />
              </strong>
              <span>
                {t("mashgʻulotlar", "тренировок", "trainings")}
              </span>
            </div>
          </div>
          <div className={s.trustItem} style={{ ["--i" as any]: 2 }}>
            <ReadOutlined />
            <div>
              <strong>
                <CountUp value={50} />
              </strong>
              <span>{t("kitoblar", "книг", "books")}</span>
            </div>
          </div>
          <div className={s.trustItem} style={{ ["--i" as any]: 3 }}>
            <StarFilled />
            <div>
              <strong>
                <CountUp value={20} />
              </strong>
              <span>{t("masterclass", "мастер-классов", "masterclasses")}</span>
            </div>
          </div>
        </section>

        {/* ─────────── 2.5 CONTINUE WATCHING (auth + has progress) ─────── */}
        <ContinueWatching lang={lang} />

        {/* ─────────── 3. FEATURED TRAININGS ─────────── */}
        <section
          ref={trainReveal.ref}
          className={`${s.section} ${s.reveal} ${
            trainReveal.revealed ? s.revealed : ""
          }`}
        >
          <header className={s.sectionHeader}>
            <div>
              <h2 className={s.sectionTitle}>
                {t("Mashgʻulotlar", "Тренировки", "Trainings")}
              </h2>
              <p className={s.sectionSub}>
                {t(
                  "Yosh va mavzu boʻyicha kategoriyalar — bepullari ham bor.",
                  "Категории по возрастам и темам — есть бесплатные.",
                  "Categories by age and topic — free ones included."
                )}
              </p>
            </div>
            <Link to="/training" className={s.seeAll}>
              {t("Barchasi", "Все", "View all")}
              <ArrowRightOutlined />
            </Link>
          </header>

          <div className={s.trainingGrid}>
            {trainings.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={s.trainingSkeleton} />
                ))
              : trainings.map((c, idx) => {
                  const cover = c.imageUrl;
                  return (
                    <Link
                      key={c.id}
                      to={`/training/${c.id}`}
                      className={s.trainingCard}
                      style={{ ["--gi" as any]: idx }}
                    >
                      <div
                        className={s.trainingImg}
                        style={
                          isUrl(cover)
                            ? { backgroundImage: `url("${cover}")` }
                            : { background: FALLBACK_BG }
                        }
                      >
                        {c.ageCategory && (
                          <span className={s.ageBadge}>
                            {c.ageCategory.titleUz}
                          </span>
                        )}
                      </div>
                      <div className={s.trainingBody}>
                        <h3 className={s.trainingTitle}>
                          {pick(c.titleUz, c.titleRu)}
                        </h3>
                        <div className={s.trainingMeta}>
                          <PlayCircleFilled />
                          {typeof c.lessonCount === "number"
                            ? `${c.lessonCount} ${t(
                                "ta dars",
                                "урок(ов)",
                                "lessons"
                              )}`
                            : t("Darslar", "Уроки", "Lessons")}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─────────── 4. FEATURED BOOKS ─────────── */}
        <section
          ref={booksReveal.ref}
          className={`${s.section} ${s.reveal} ${
            booksReveal.revealed ? s.revealed : ""
          }`}
        >
          <header className={s.sectionHeader}>
            <div>
              <h2 className={s.sectionTitle}>
                {t("Kutubxona", "Библиотека", "Library")}
              </h2>
              <p className={s.sectionSub}>
                {t(
                  "Mutaxassislardan kitoblar va konspektlar.",
                  "Книги и конспекты от профессионалов.",
                  "Books and notes from professionals."
                )}
              </p>
            </div>
            <Link to="/books" className={s.seeAll}>
              {t("Barchasi", "Все", "View all")}
              <ArrowRightOutlined />
            </Link>
          </header>

          <div className={s.bookGrid}>
            {books.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={s.bookSkeleton} />
                ))
              : books.map((b, idx) => {
                  const final = computeDisplayPrice(b);
                  const discounted = hasDiscount(b);
                  const isFree = b.basePrice === 0;
                  return (
                    <Link
                      key={b.id}
                      to={`/books/${b.id}`}
                      className={s.bookCard}
                      style={{ ["--gi" as any]: idx }}
                    >
                      <div
                        className={s.bookCover}
                        style={
                          isUrl(b.coverImageUrl)
                            ? {
                                backgroundImage: `url("${b.coverImageUrl}")`,
                              }
                            : { background: FALLBACK_BG }
                        }
                      >
                        {!isUrl(b.coverImageUrl) && (
                          <BookOutlined className={s.bookCoverIcon} />
                        )}
                        {isFree ? (
                          <span className={s.bookBadgeFree}>
                            <GiftOutlined />
                            {t("Bepul", "Бесплатно", "Free")}
                          </span>
                        ) : discounted ? (
                          <span className={s.bookBadgeSale}>
                            {t("Chegirma", "Скидка", "Sale")}
                          </span>
                        ) : null}
                      </div>
                      <div className={s.bookBody}>
                        <h3 className={s.bookTitle}>
                          {pick(b.titleUz, b.titleRu)}
                        </h3>
                        <div className={s.bookPrice}>
                          {isFree ? (
                            <span className={s.bookPriceFree}>
                              {t("Bepul", "Бесплатно", "Free")}
                            </span>
                          ) : (
                            <>
                              {discounted && (
                                <span className={s.bookPriceOld}>
                                  {formatPrice(b.basePrice)}
                                </span>
                              )}
                              <span className={s.bookPriceNow}>
                                {formatPrice(final)}{" "}
                                {t("soʻm", "сум", "UZS")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* ─────────── 5. MASTERCLASS SLIDER ─────────── */}
        {masterclasses.length > 0 && (
          <section
            ref={mcReveal.ref}
            className={`${s.section} ${s.reveal} ${
              mcReveal.revealed ? s.revealed : ""
            }`}
          >
            <header className={s.sectionHeader}>
              <div>
                <h2 className={s.sectionTitle}>
                  {t("Masterclasslar", "Мастер-классы", "Masterclasses")}
                </h2>
                <p className={s.sectionSub}>
                  {t(
                    "Yetakchi murabbiylardan chuqur mavzular.",
                    "Глубокое погружение в темы от ведущих тренеров.",
                    "Deep dives into key topics from leading coaches."
                  )}
                </p>
              </div>
              <Link to="/masterclass" className={s.seeAll}>
                {t("Barchasi", "Все", "View all")}
                <ArrowRightOutlined />
              </Link>
            </header>

            <div className={s.mcRow}>
              {masterclasses.map((m, idx) => {
                const cover = m.masterclassCategory?.imageUrl;
                return (
                  <Link
                    key={m.id}
                    to={`/masterclass/${m.id}`}
                    className={s.mcCard}
                    style={{ ["--gi" as any]: idx }}
                  >
                    <div
                      className={s.mcImg}
                      style={
                        isUrl(cover)
                          ? { backgroundImage: `url("${cover}")` }
                          : { background: FALLBACK_BG }
                      }
                    >
                      <div className={s.mcOverlay} />
                      <span className={s.mcKind}>
                        {t("Masterclass", "Мастер-класс", "Masterclass")}
                      </span>
                    </div>
                    <div className={s.mcBody}>
                      <h3 className={s.mcTitle}>
                        {pick(m.titleUz, m.titleRu)}
                      </h3>
                      {m.masterclassCategory && (
                        <div className={s.mcCat}>
                          {pick(
                            m.masterclassCategory.titleUz,
                            m.masterclassCategory.titleRu
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─────────── 6. PRICING TEASER ─────────── */}
        {(plans.length > 0 || plansLoading) && (
          <section
            ref={plansReveal.ref}
            className={`${s.section} ${s.reveal} ${
              plansReveal.revealed ? s.revealed : ""
            }`}
          >
            <header className={s.sectionHeaderCenter}>
              <div className={s.heroBadge}>
                <CrownOutlined />
                {t("Obuna", "Подписка", "Subscription")}
              </div>
              <h2 className={s.sectionTitleCenter}>
                {t(
                  "Yana koʻproq kerakmi? Barcha materiallarni oching",
                  "Хотите больше? Откройте все материалы",
                  "Want more? Unlock all the content"
                )}
              </h2>
              <p className={s.sectionSubCenter}>
                {t(
                  "Bepul darslar bepul qoladi. Obuna premium kontentni ochib beradi.",
                  "Бесплатные уроки остаются бесплатными. Подписка открывает премиум-контент.",
                  "Free lessons stay free. A subscription unlocks premium content."
                )}
              </p>
            </header>

            <div className={s.planCarousel}>
              {planMaxStart > 0 && (
                <button
                  type="button"
                  className={`${s.planNav} ${s.planNavPrev}`}
                  disabled={planStart === 0}
                  onClick={() =>
                    setPlanStart((i) => Math.max(0, i - 1))
                  }
                  aria-label={t("Oldingi", "Предыдущий", "Previous")}
                >
                  <ArrowLeftOutlined />
                </button>
              )}

              <div
                className={s.planViewport}
                style={{ ["--per-page" as any]: plansPerPage }}
              >
                <div
                  className={s.planTrack}
                  style={{
                    ["--shift" as any]: planStart,
                  }}
                >
                  {plans.length === 0 && plansLoading
                    ? Array.from({ length: plansPerPage }).map((_, i) => (
                        <div
                          key={`skel-${i}`}
                          className={`${s.planCard} ${s.planCardSkeleton}`}
                        />
                      ))
                    : null}
                  {plans.map((p, idx) => {
                const isRecommended =
                  p.id === recommendedPlanId && plans.length > 1;
                const discounted = planHasDiscount(p);
                const finalP = calcFinalPrice(p);
                const percent = discountPercentValue(p);
                const dur = durationLabel(p.durationDays, lang);
                const visibleFeatures = (p.features ?? []).slice(0, 5);
                return (
                  <div
                    key={p.id}
                    className={`${s.planCard} ${
                      isRecommended ? s.planCardRecommended : ""
                    }`}
                    style={{ ["--gi" as any]: idx }}
                  >
                    {isRecommended && (
                      <div className={s.planRibbon}>
                        <ThunderboltFilled />
                        {t("Eng foydali", "Лучший выбор", "Best value")}
                      </div>
                    )}
                    {discounted && (
                      <span className={s.planDiscount}>−{percent}%</span>
                    )}

                    <div className={s.planHead}>
                      <h3 className={s.planTitle}>{planTitleFn(p, lang)}</h3>
                      <div className={s.planDurMeta}>
                        <ClockCircleOutlined />
                        {dur}
                      </div>
                    </div>

                    <div className={s.planPriceBlock}>
                      {discounted && (
                        <span className={s.planPriceOld}>
                          {formatPlanPrice(p.basePrice)}{" "}
                          {t("soʻm", "сум", "UZS")}
                        </span>
                      )}
                      <div className={s.planPriceRow}>
                        <span className={s.planPriceNow}>
                          {formatPlanPrice(finalP)}
                        </span>
                        <span className={s.planPriceCur}>
                          {t("soʻm", "сум", "UZS")}
                        </span>
                      </div>
                      <span className={s.planDur}>/ {dur}</span>
                    </div>

                    {visibleFeatures.length > 0 && (
                      <ul className={s.planFeatures}>
                        {visibleFeatures.map((f, i) => (
                          <li
                            key={i}
                            className={`${s.planFeatureItem} ${
                              f.highlight ? s.planFeatureHighlight : ""
                            }`}
                          >
                            <CheckCircleFilled />
                            <span>{featureText(f, lang)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link to={`/plans/${p.id}`} className={s.planDetails}>
                      {t("Batafsil", "Подробнее", "Details")}
                    </Link>

                    <Link
                      to={`/plans/${p.id}`}
                      className={`${s.planSubscribeBtn} ${
                        isRecommended ? s.planSubscribeBtnPrimary : ""
                      }`}
                    >
                      <CrownOutlined />
                      {t("Obuna boʻlish", "Подписаться", "Subscribe")}
                    </Link>
                  </div>
                );
              })}
                </div>
              </div>

              {planMaxStart > 0 && (
                <button
                  type="button"
                  className={`${s.planNav} ${s.planNavNext}`}
                  disabled={planStart >= planMaxStart}
                  onClick={() =>
                    setPlanStart((i) => Math.min(planMaxStart, i + 1))
                  }
                  aria-label={t("Keyingi", "Следующий", "Next")}
                >
                  <ArrowRightOutlined />
                </button>
              )}
            </div>

            {planMaxStart > 0 && (
              <div className={s.planDots} role="tablist">
                {Array.from({ length: planMaxStart + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === planStart}
                    className={`${s.planDot} ${
                      i === planStart ? s.planDotActive : ""
                    }`}
                    onClick={() => setPlanStart(i)}
                  />
                ))}
              </div>
            )}

            <div className={s.plansFooter}>
              <Link to="/plans" className={s.plansFooterLink}>
                {t("Barcha tariflar", "Все тарифы", "All plans")}
                <ArrowRightOutlined />
              </Link>
            </div>
          </section>
        )}

        {/* ─────────── 7. HOW IT WORKS ─────────── */}
        <section
          ref={stepsReveal.ref}
          className={`${s.section} ${s.reveal} ${
            stepsReveal.revealed ? s.revealed : ""
          }`}
        >
          <header className={s.sectionHeaderCenter}>
            <h2 className={s.sectionTitleCenter}>
              {t("Qanday ishlaydi", "Как это работает", "How it works")}
            </h2>
            <p className={s.sectionSubCenter}>
              {t(
                "Uch oddiy qadam — siz allaqachon oʻrganyapsiz.",
                "Три простых шага — и вы уже учитесь.",
                "Three simple steps and you're already learning."
              )}
            </p>
          </header>

          <div className={s.stepsGrid}>
            <div className={s.stepCard} style={{ ["--gi" as any]: 0 }}>
              <div className={s.stepNumber}>1</div>
              <RocketOutlined className={s.stepIcon} />
              <h3 className={s.stepTitle}>
                {t(
                  "Akkaunt yarating",
                  "Создайте аккаунт",
                  "Create an account"
                )}
              </h3>
              <p className={s.stepDesc}>
                {t(
                  "Roʻyxatdan oʻtish bepul va bir daqiqa oladi.",
                  "Регистрация бесплатна и занимает минуту.",
                  "Sign up is free and takes a minute."
                )}
              </p>
            </div>
            <div className={s.stepCard} style={{ ["--gi" as any]: 1 }}>
              <div className={s.stepNumber}>2</div>
              <PlayCircleFilled className={s.stepIcon} />
              <h3 className={s.stepTitle}>
                {t(
                  "Bepul darslarni koʻring",
                  "Смотрите бесплатные уроки",
                  "Watch the free lessons"
                )}
              </h3>
              <p className={s.stepDesc}>
                {t(
                  "Bir qator mashgʻulot va materiallar obunasiz ochiq.",
                  "Часть тренировок и материалов открыта без подписки.",
                  "Many trainings and materials are open without a subscription."
                )}
              </p>
            </div>
            <div className={s.stepCard} style={{ ["--gi" as any]: 2 }}>
              <div className={s.stepNumber}>3</div>
              <CrownOutlined className={s.stepIcon} />
              <h3 className={s.stepTitle}>
                {t(
                  "Obuna bilan barchasini oching",
                  "Откройте всё с подпиской",
                  "Unlock everything with a plan"
                )}
              </h3>
              <p className={s.stepDesc}>
                {t(
                  "Tayyor boʻlganingizda — mos tarifni ulang.",
                  "Когда будете готовы — подключите подходящий тариф.",
                  "When you're ready, pick a plan that fits."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ─────────── 7.5 TESTIMONIALS ─────────── */}
        <section
          ref={tReveal.ref}
          className={`${s.section} ${s.reveal} ${
            tReveal.revealed ? s.revealed : ""
          }`}
        >
          <header className={s.sectionHeaderCenter}>
            <div className={s.heroBadge}>
              <StarFilled />
              {t("Foydalanuvchilar fikri", "Отзывы", "Testimonials")}
            </div>
            <h2 className={s.sectionTitleCenter}>
              {t(
                "Murabbiylar va oʻyinchilar nima deyishadi",
                "Что говорят тренеры и игроки",
                "What coaches and players say"
              )}
            </h2>
            <p className={s.sectionSubCenter}>
              {t(
                "Platforma Oʻzbekiston boʻylab minglab murabbiylarga yordam beryapti.",
                "Платформа уже помогает тысячам тренеров по всему Узбекистану.",
                "The platform already helps thousands of coaches across Uzbekistan."
              )}
            </p>
          </header>

          <div className={s.testimonialMarquee}>
            <div className={s.testimonialTrack}>
              {[...TESTIMONIALS, ...TESTIMONIALS].map((tm, idx) => {
                const initials = pick(tm.nameUz, tm.nameRu)
                  .split(/\s+/)
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <article
                    key={`${tm.id}-${idx}`}
                    className={s.testimonialCard}
                    aria-hidden={idx >= TESTIMONIALS.length ? "true" : undefined}
                  >
                    <div className={s.testimonialStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarFilled
                          key={i}
                          className={
                            i < tm.rating ? s.starFilled : s.starEmpty
                          }
                        />
                      ))}
                    </div>
                    <p className={s.testimonialQuote}>
                      “{pick(tm.quoteUz, tm.quoteRu)}”
                    </p>
                    <div className={s.testimonialAuthor}>
                      <div
                        className={s.testimonialAvatar}
                        style={{ background: tm.avatarBg }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className={s.testimonialName}>
                          {pick(tm.nameUz, tm.nameRu)}
                        </div>
                        <div className={s.testimonialRole}>
                          {pick(tm.roleUz, tm.roleRu)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────── 8. FINAL CTA ─────────── */}
        <section
          ref={finalReveal.ref}
          className={`${s.finalCta} ${s.reveal} ${
            finalReveal.revealed ? s.revealed : ""
          }`}
        >
          <h2 className={s.finalTitle}>
            {t(
              "Bugun oʻrganishni boshlang",
              "Начните учиться сегодня",
              "Start learning today"
            )}
          </h2>
          <p className={s.finalSub}>
            {t(
              "Roʻyxatdan oʻtish bepul. Hech qanday karta yoki majburiyat yoʻq.",
              "Регистрация бесплатна. Никаких карт и обязательств.",
              "Sign up is free. No cards, no commitments."
            )}
          </p>
          <div className={s.finalActions}>
            <Link to="/register" className={s.heroBtnPrimary}>
              {t("Akkaunt yaratish", "Создать аккаунт", "Create account")}
              <ArrowRightOutlined />
            </Link>
            <Link to="/training" className={s.heroBtnGhostInverse}>
              {t("Darslarni koʻrish", "Посмотреть уроки", "Browse lessons")}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default HomePageV2;
