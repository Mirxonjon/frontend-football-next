"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "@/lib/router-compat";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  StarFilled,
  DownloadOutlined,
  LockOutlined,
  ThunderboltFilled,
  FileTextOutlined,
  AimOutlined,
  MessageOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";
import {
  fetchBookById,
  fetchBooks,
  fetchMyBooks,
  fetchDownloadUrl,
  computeDisplayPrice,
  hasDiscount,
  formatPrice,
  isPercentDiscountType,
  type Book,
} from "../../store/books/booksSlice";
import PurchaseModal from "../../components/ui/PurchaseModal/PurchaseModal";
import s from "./BookSinglePage.module.scss";

const isAbsoluteUrl = (u: string | null | undefined): u is string =>
  typeof u === "string" &&
  (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("blob:"));

const formatDate = (iso: string, lang: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(
      lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  } catch {
    return iso;
  }
};

const detectFileFormat = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const cleaned = url.split("?")[0].toLowerCase();
  const ext = cleaned.substring(cleaned.lastIndexOf(".") + 1);
  if (!ext || ext.length > 5) return null;
  return ext.toUpperCase();
};

const SafeImg = ({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) => {
  const [errored, setErrored] = useState(false);
  if (!isAbsoluteUrl(src) || errored) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};

const BookSinglePage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const [messageApi, contextHolder] = message.useMessage();
  const [favorited, setFavorited] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const book = useSelector((state: any) => state.books.current as Book | null);
  const loading = useSelector(
    (state: any) => state.books.currentLoading as boolean
  );
  const error = useSelector(
    (state: any) => state.books.currentError as string
  );
  const allBooks = useSelector((state: any) => state.books.items as Book[]);
  const ownedBookIds = useSelector(
    (state: any) =>
      (state.books?.ownedBookIds ?? {}) as Record<number, true>
  );
  const lang = useSelector((state: any) => state.lang.lang);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  useEffect(() => {
    if (id) dispatch(fetchBookById(id));
  }, [dispatch, id]);

  // Load my-books once so we know if user already owns this book
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      dispatch(fetchMyBooks());
    }
  }, [dispatch]);

  // Fetch siblings for "Tavsiya etamiz" — same category, by type
  useEffect(() => {
    if (book?.bookCategory?.categoryType) {
      dispatch(
        fetchBooks({ categoryType: book.bookCategory.categoryType })
      );
    }
  }, [dispatch, book?.bookCategory?.categoryType]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  // Reset gallery when book changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [book?.id]);

  const gallery = useMemo<string[]>(() => {
    if (!book) return [];
    const imgs: string[] = [];
    if (book.coverImageUrl) imgs.push(book.coverImageUrl);
    return imgs;
  }, [book]);

  const recommended = useMemo<Book[]>(() => {
    if (!book) return [];
    // Fisher-Yates shuffle for stable random order per book load
    const pool = allBooks.filter((b) => b.id !== book.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, [allBooks, book]);

  if (loading && !book) {
    return (
      <Container>
        <div className={s.loader}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  if (!book) {
    return (
      <Container>
        {contextHolder}
        <NotFound
          style={{ margin: "60px 0" }}
          subTitle={
            t("Kitob topilmadi", "Книга не найдена", "Book not found")
          }
        />
      </Container>
    );
  }

  const title = pick(book.titleUz, book.titleRu);
  const description = pick(book.descriptionUz, book.descriptionRu);
  const isKonspekt = book.bookCategory?.categoryType === "KONSPEKT";
  const price = computeDisplayPrice(book);
  const discounted = hasDiscount(book);
  const mainImage = gallery[activeImageIdx] ?? null;
  const fileFormat = detectFileFormat(book.fileUrl);

  return (
    <Container>
      <Helmet>
        <title>{`${title} — CoachingZona`}</title>
        <meta name="description" content={description} />
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/books" className={s.back}>
          <ArrowLeftOutlined />
          <span>
            {t("Kutubxonaga qaytish", "К библиотеке", "Back to library")}
          </span>
        </Link>

        <div
          className={`${s.layout} ${gallery.length > 1 ? "" : s.layoutNoThumbs}`}
        >
          {/* ─── Thumbnails column ─── */}
          {gallery.length > 1 && (
            <div className={s.thumbs}>
              {gallery.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  className={`${s.thumb} ${i === activeImageIdx ? s.thumbActive : ""}`}
                  onClick={() => setActiveImageIdx(i)}
                >
                  <SafeImg
                    src={src}
                    alt={`${title} ${i + 1}`}
                    fallback={
                      <div className={s.thumbFallback}>
                        <BookOutlined />
                      </div>
                    }
                  />
                </button>
              ))}
            </div>
          )}

          {/* ─── Content column (image+info side-by-side, then desc + tactic) ─── */}
          <div className={s.contentCol}>
            <div className={s.topRow}>
              <div className={s.mainImage}>
            <button
              type="button"
              className={s.heartFloat}
              onClick={() => setFavorited((f) => !f)}
              aria-label="Favorite"
            >
              {favorited ? <HeartFilled /> : <HeartOutlined />}
            </button>
            {discounted && (
              <span className={s.discountBadge}>
                {isPercentDiscountType(book.discountType)
                  ? `-${book.discountPercent}%`
                  : t("Chegirma", "Скидка", "Sale")}
              </span>
            )}
            {isKonspekt && (
              <span className={s.kindBadge}>
                {t("Konspekt", "Конспект", "Notes")}
              </span>
            )}
            <SafeImg
              src={mainImage}
              alt={title}
              fallback={
                <div className={s.coverFallback}>
                  <BookOutlined />
                  <span>BOOK</span>
                </div>
              }
            />
          </div>

          {/* ─── Info column ─── */}
          <div className={s.info}>
            <h1 className={s.title}>{title}</h1>

            <div className={s.rating}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarFilled key={n} className={s.starOn} />
              ))}
              <span className={s.ratingText}>5.0</span>
            </div>

            <div className={`${s.priceBlock} ${discounted ? s.priceBlockDiscount : ""}`}>
              {discounted && (
                <div className={s.discountStrip}>
                  <span className={s.discountBolt}>
                    <ThunderboltFilled />
                  </span>
                  <span className={s.discountLabel}>
                    {t("Chegirma", "Скидка", "Sale")}
                  </span>
                  <span className={s.discountValue}>
                    {isPercentDiscountType(book.discountType)
                      ? `−${book.discountPercent}%`
                      : `−${formatPrice(book.basePrice - price, lang)}`}
                  </span>
                </div>
              )}
              <div className={s.priceRowMain}>
                <div className={s.priceNow}>{formatPrice(price, lang)}</div>
                {discounted && (
                  <div className={s.priceOld}>
                    {formatPrice(book.basePrice, lang)}
                  </div>
                )}
              </div>
              {discounted && (
                <div className={s.savings}>
                  {t("Tejaysiz", "Экономия", "You save")}:
                  <strong>
                    {" "}
                    {formatPrice(book.basePrice - price, lang)}
                  </strong>
                </div>
              )}
            </div>

            <div className={s.actions}>
              {ownedBookIds[book.id] ? (
                <>
                  <Link
                    to={`/me/books/${book.id}/ai-chat`}
                    className={`${s.buyBtn} ${s.aiChatBtn}`}
                  >
                    <MessageOutlined />
                    {t(
                      "AI murabbiy bilan suhbat",
                      "Чат с AI тренером",
                      "Chat with AI coach"
                    )}
                  </Link>
                  <button
                  type="button"
                  className={s.buyBtn}
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true);
                    try {
                      const res = await dispatch(
                        fetchDownloadUrl(book.id)
                      ).unwrap();
                      window.open(res.url, "_blank", "noopener,noreferrer");
                    } catch (err: any) {
                      messageApi.error(err || "Xatolik");
                    } finally {
                      setDownloading(false);
                    }
                  }}
                >
                  <DownloadOutlined />
                  {downloading
                    ? t("Yuklanmoqda...", "Загрузка...", "Loading…")
                    : t("Yuklab olish", "Скачать", "Download")}
                </button>
                </>
              ) : (
                <button
                  type="button"
                  className={s.buyBtn}
                  onClick={() => setPurchaseOpen(true)}
                >
                  {price <= 0 ? (
                    <>
                      <DownloadOutlined />
                      {t("Olish", "Получить", "Get")}
                    </>
                  ) : (
                    <>
                      <ShoppingCartOutlined />
                      {t("Sotib olish", "Купить", "Buy")}
                    </>
                  )}
                </button>
              )}
            </div>

            {price > 0 && !ownedBookIds[book.id] && (
              <div className={s.lockNote}>
                <LockOutlined />
                <span>
                  {t(
                    "Fayl sotib olgandan so‘ng yuklab olinadi",
                    "Файл будет доступен после покупки",
                    "The file becomes available after purchase"
                  )}
                </span>
              </div>
            )}

            <dl className={s.meta}>
              <div className={s.metaRow}>
                <dt>ID</dt>
                <dd>#{book.id}</dd>
              </div>
              {book.bookCategory && (
                <div className={s.metaRow}>
                  <dt>{t("Kategoriya", "Категория", "Category")}</dt>
                  <dd>
                    {pick(
                      book.bookCategory.titleUz,
                      book.bookCategory.titleRu
                    )}
                  </dd>
                </div>
              )}
              <div className={s.metaRow}>
                <dt>{t("Turi", "Тип", "Type")}</dt>
                <dd>
                  {isKonspekt
                    ? t("Konspekt", "Конспект", "Notes")
                    : t("Kitob", "Книга", "Book")}
                </dd>
              </div>
              {fileFormat && (
                <div className={s.metaRow}>
                  <dt>{t("Format", "Формат", "Format")}</dt>
                  <dd>
                    <span className={s.formatPill}>{fileFormat}</span>
                  </dd>
                </div>
              )}
              <div className={s.metaRow}>
                <dt>{t("Asosiy narx", "Базовая цена", "Base price")}</dt>
                <dd>{formatPrice(book.basePrice, lang)}</dd>
              </div>
              {book.discountType !== "NONE" && (
                <div className={s.metaRow}>
                  <dt>{t("Chegirma", "Скидка", "Discount")}</dt>
                  <dd>
                    {isPercentDiscountType(book.discountType)
                      ? `${book.discountPercent}%`
                      : book.fixedDiscountPrice != null
                        ? formatPrice(book.fixedDiscountPrice, lang)
                        : "—"}
                  </dd>
                </div>
              )}
              <div className={s.metaRow}>
                <dt>{t("Qo‘shilgan", "Добавлено", "Added")}</dt>
                <dd>{formatDate(book.createdAt, lang)}</dd>
              </div>
              {book.updatedAt && book.updatedAt !== book.createdAt && (
                <div className={s.metaRow}>
                  <dt>{t("Yangilangan", "Обновлено", "Updated")}</dt>
                  <dd>{formatDate(book.updatedAt, lang)}</dd>
                </div>
              )}
            </dl>

          </div>
            </div>

            {description && (
              <section className={s.descCard}>
                <h3 className={s.descCardTitle}>
                  {t("Mahsulot tavsifi", "Описание товара", "Description")}
                </h3>
                {description
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className={s.descCardText}>
                      {para}
                    </p>
                  ))}
              </section>
            )}

            {isAbsoluteUrl(book.tacticHintImg) && (
              <section className={s.tacticBlock}>
                <h3 className={s.tacticTitle}>
                  <AimOutlined />
                  {t("Taktik diagramma", "Тактическая схема", "Tactical diagram")}
                </h3>
                <div className={s.tacticImageWrap}>
                  <SafeImg
                    src={book.tacticHintImg}
                    alt={t("Taktika", "Тактика", "Tactics")}
                    className={s.tacticImg}
                    fallback={
                      <div className={s.tacticFallback}>
                        <AimOutlined />
                      </div>
                    }
                  />
                </div>
              </section>
            )}
          </div>

          {/* ─── Recommended sidebar ─── */}
          <aside className={s.recommend}>
            <div className={s.recTitle}>
              {t("Tavsiya etamiz", "Рекомендуем", "Recommended")}
            </div>
            {recommended.length === 0 ? (
              <div className={s.recEmpty}>
                {t("Hozircha bo‘sh", "Пока пусто", "Nothing yet")}
              </div>
            ) : (
              <div className={s.recList}>
                {recommended.map((rb) => {
                  const rbPrice = computeDisplayPrice(rb);
                  const rbDiscounted = hasDiscount(rb);
                  return (
                    <Link
                      to={`/books/${rb.id}`}
                      key={rb.id}
                      className={s.recCard}
                    >
                      <div className={s.recCover}>
                        <SafeImg
                          src={rb.coverImageUrl}
                          alt={pick(rb.titleUz, rb.titleRu)}
                          fallback={
                            <div className={s.recCoverFallback}>
                              <BookOutlined />
                            </div>
                          }
                        />
                        {rbDiscounted && (
                          <span className={s.recDiscountBadge}>
                            <ThunderboltFilled />
                            {isPercentDiscountType(rb.discountType)
                              ? `−${rb.discountPercent}%`
                              : t("Chegirma", "Скидка", "Sale")}
                          </span>
                        )}
                      </div>
                      <div className={s.recBody}>
                        <div className={s.recName}>
                          {pick(rb.titleUz, rb.titleRu)}
                        </div>
                        <div className={s.recPriceRow}>
                          <span className={s.recPriceWrap}>
                            {rbDiscounted && (
                              <span className={s.recPriceOld}>
                                {formatPrice(rb.basePrice, lang)}
                              </span>
                            )}
                            <span
                              className={`${s.recPrice} ${rbDiscounted ? s.recPriceDiscount : ""}`}
                            >
                              {formatPrice(rbPrice, lang)}
                            </span>
                          </span>
                          <HeartOutlined className={s.recHeart} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>

      <PurchaseModal
        open={purchaseOpen}
        book={book}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => {
          // Refresh ownership state and book detail
          dispatch(fetchMyBooks());
          if (id) dispatch(fetchBookById(id));
        }}
      />
    </Container>
  );
};

export default BookSinglePage;
