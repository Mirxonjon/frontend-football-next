"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Segmented, Spin, Select, message } from "antd";
import {
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  SortAscendingOutlined,
  ThunderboltFilled,
  TagOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import Search from "../../components/ui/Search/Search";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";

import {
  fetchBookCategories,
  bookCategoriesActions,
  type BookCategory,
  type BookCategoryType,
  type BookSort,
} from "../../store/bookCategories/bookCategoriesSlice";
import {
  fetchBooks,
  computeDisplayPrice,
  hasDiscount,
  formatPrice,
  isPercentDiscountType,
  type Book,
  type BookSortBy,
  type BookSortOrder,
  type BooksPagination,
} from "../../store/books/booksSlice";
import ModernPagination from "../../components/ui/ModernPagination/ModernPagination";

const booksSliceActions = {
  setPage: (page: number) => ({ type: "books/setPage", payload: page }),
  setLimit: (limit: number) => ({ type: "books/setLimit", payload: limit }),
  resetPage: () => ({ type: "books/resetPage" }),
};

const SORT_TO_PARAMS: Record<BookSort, { sortBy: BookSortBy; sortOrder: BookSortOrder }> = {
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  oldest: { sortBy: "createdAt", sortOrder: "asc" },
  priceAsc: { sortBy: "basePrice", sortOrder: "asc" },
  priceDesc: { sortBy: "basePrice", sortOrder: "desc" },
};
import s from "./BooksPage.module.scss";

const isAbsoluteUrl = (u: string | null | undefined): u is string =>
  typeof u === "string" &&
  (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("blob:"));

const SafeBookCover = ({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) => {
  const [errored, setErrored] = useState(false);
  if (!isAbsoluteUrl(src) || errored) {
    return (
      <div className={className}>
        <BookOutlined />
        <span>BOOK</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};

const BooksPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  const categories = useSelector(
    (state: any) => (state.bookCategories?.items ?? []) as BookCategory[]
  );
  const catLoading = useSelector(
    (state: any) => (state.bookCategories?.loading ?? false) as boolean
  );
  const search = useSelector(
    (state: any) => (state.bookCategories?.search ?? "") as string
  );
  const selectedType = useSelector(
    (state: any) =>
      (state.bookCategories?.selectedType ?? "ALL") as
        | BookCategoryType
        | "ALL"
  );
  const selectedCategoryId = useSelector(
    (state: any) =>
      (state.bookCategories?.selectedCategoryId ?? null) as number | null
  );
  const sort = useSelector(
    (state: any) => (state.bookCategories?.sort ?? "newest") as BookSort
  );
  const hasDiscountFilter = useSelector(
    (state: any) => (state.bookCategories?.hasDiscount ?? false) as boolean
  );
  const freeOnly = useSelector(
    (state: any) => (state.bookCategories?.freeOnly ?? false) as boolean
  );

  const books = useSelector(
    (state: any) => (state.books?.items ?? []) as Book[]
  );
  const booksLoading = useSelector(
    (state: any) => (state.books?.loading ?? false) as boolean
  );
  const booksError = useSelector(
    (state: any) => (state.books?.error ?? "") as string
  );
  const booksPagination = useSelector(
    (state: any) =>
      (state.books?.pagination ?? {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      }) as BooksPagination
  );

  const lang = useSelector((state: any) => state.lang.lang);
  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  // Load categories (filtered by type & search for the sidebar)
  useEffect(() => {
    dispatch(
      fetchBookCategories({
        search: search || undefined,
        categoryType: selectedType !== "ALL" ? selectedType : undefined,
      })
    );
  }, [dispatch, search, selectedType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    dispatch(booksSliceActions.resetPage());
  }, [
    dispatch,
    selectedCategoryId,
    search,
    selectedType,
    sort,
    hasDiscountFilter,
    freeOnly,
  ]);

  // Load books (filtered by type, category, search, sort, discount, free, page)
  useEffect(() => {
    const sortParams = SORT_TO_PARAMS[sort];
    dispatch(
      fetchBooks({
        categoryId: selectedCategoryId ?? undefined,
        search: search || undefined,
        categoryType: selectedType !== "ALL" ? selectedType : undefined,
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder,
        hasDiscount: hasDiscountFilter || undefined,
        isFree: freeOnly || undefined,
      })
    );
  }, [
    dispatch,
    selectedCategoryId,
    search,
    selectedType,
    sort,
    hasDiscountFilter,
    freeOnly,
    booksPagination.page,
    booksPagination.limit,
  ]);

  useEffect(() => {
    if (booksError) messageApi.error(booksError);
  }, [booksError, messageApi]);

  const counts = useMemo(() => {
    const all = categories.length;
    const bookCount = categories.filter(
      (c) => c.categoryType === "BOOK"
    ).length;
    const konspektCount = categories.filter(
      (c) => c.categoryType === "KONSPEKT"
    ).length;
    return { all, books: bookCount, konspekts: konspektCount };
  }, [categories]);

  const sectionTitle =
    selectedType === "KONSPEKT"
      ? t("Konspektlar", "Конспекты", "Notes")
      : selectedType === "BOOK"
        ? t("Kitoblar", "Книги", "Books")
        : t("Barcha materiallar", "Все материалы", "All materials");

  return (
    <Container>
      <Helmet>
        <title>Coach Hub — Kitoblar va Konspektlar</title>
        <meta
          name="description"
          content="Futbol kitoblari, konspektlari va oʻquv materiallari toʻplami."
        />
        <link rel="canonical" href="https://coaching-center.uz/books" />
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <header className={s.pageHeader}>
          <h1 className={s.pageTitle}>
            {t("Kutubxona", "Библиотека", "Library")}
          </h1>
          <div className={s.searchBox}>
            <Search
              placeholder={t("Izlash…", "Поиск…", "Search…")}
              value={search}
              onChange={(e: any) =>
                dispatch(bookCategoriesActions.setSearch(e.target.value))
              }
              allowClear
            />
          </div>
        </header>

        {/* ───── Top filter strip ───── */}
        <div className={s.topBar}>
          <Segmented
            value={selectedType}
            onChange={(v) =>
              dispatch(
                bookCategoriesActions.setType(v as BookCategoryType | "ALL")
              )
            }
            options={[
              {
                value: "ALL",
                label: (
                  <span className={s.segLabel}>
                    <AppstoreOutlined />
                    {t("Barchasi", "Все", "All")}
                    <span className={s.segCount}>{counts.all}</span>
                  </span>
                ),
              },
              {
                value: "BOOK",
                label: (
                  <span className={s.segLabel}>
                    <BookOutlined />
                    {t("Kitoblar", "Книги", "Books")}
                    <span className={s.segCount}>{counts.books}</span>
                  </span>
                ),
              },
              {
                value: "KONSPEKT",
                label: (
                  <span className={s.segLabel}>
                    <FileTextOutlined />
                    {t("Konspektlar", "Конспекты", "Notes")}
                    <span className={s.segCount}>{counts.konspekts}</span>
                  </span>
                ),
              },
            ]}
            size="large"
          />

        <div className={s.filterRow}>
          <div className={s.filterCluster}>
            <span className={s.clusterLabel}>
              <SortAscendingOutlined />
              {t("Saralash", "Сортировка", "Sort")}
            </span>
            <Select
              size="middle"
              value={sort}
              onChange={(v) =>
                dispatch(bookCategoriesActions.setSort(v as BookSort))
              }
              options={[
                {
                  value: "newest",
                  label: t("Yangilari oldin", "Новые сначала", "Newest first"),
                },
                {
                  value: "oldest",
                  label: t("Eskilari oldin", "Старые сначала", "Oldest first"),
                },
                {
                  value: "priceAsc",
                  label: t(
                    "Arzondan qimmatga",
                    "Сначала дешёвые",
                    "Price: low to high"
                  ),
                },
                {
                  value: "priceDesc",
                  label: t(
                    "Qimmatdan arzonga",
                    "Сначала дорогие",
                    "Price: high to low"
                  ),
                },
              ]}
              className={s.sortSelect}
              variant="borderless"
            />
          </div>

          <span className={s.filterDivider} />

          <div className={s.filterCluster}>
            <span className={s.clusterLabel}>
              {t("Filtrlar", "Фильтры", "Filters")}
            </span>

            <button
              type="button"
              className={`${s.filterChip} ${hasDiscountFilter ? s.filterChipDiscount : ""}`}
              onClick={() =>
                dispatch(
                  bookCategoriesActions.setHasDiscount(!hasDiscountFilter)
                )
              }
            >
              <span className={s.chipIcon}>
                <ThunderboltFilled />
              </span>
              <span className={s.chipText}>
                {t("Chegirmali", "Со скидкой", "On sale")}
              </span>
              {hasDiscountFilter && <span className={s.chipDot} />}
            </button>

            <button
              type="button"
              className={`${s.filterChip} ${freeOnly ? s.filterChipFree : ""}`}
              onClick={() =>
                dispatch(bookCategoriesActions.setFreeOnly(!freeOnly))
              }
            >
              <span className={s.chipIcon}>
                <TagOutlined />
              </span>
              <span className={s.chipText}>
                {t("Bepul", "Бесплатные", "Free")}
              </span>
              {freeOnly && <span className={s.chipDot} />}
            </button>
          </div>

          {(hasDiscountFilter || freeOnly || sort !== "newest") && (
            <button
              type="button"
              className={s.resetBtn}
              onClick={() => {
                dispatch(bookCategoriesActions.setSort("newest"));
                dispatch(bookCategoriesActions.setHasDiscount(false));
                dispatch(bookCategoriesActions.setFreeOnly(false));
              }}
            >
              {t("Tozalash", "Сбросить", "Reset")}
            </button>
          )}
          </div>
        </div>

        {/* ───── 2-column layout: sidebar + grid ───── */}
        <div className={s.layout}>
          {/* Categories sidebar */}
          <aside className={s.sidebar}>
            <div className={s.sidebarTitle}>
              {t("Kategoriyalar", "Категории", "Categories")}
            </div>
            <ul className={s.catList}>
              <li>
                <button
                  type="button"
                  className={`${s.catItem} ${selectedCategoryId === null ? s.catActive : ""}`}
                  onClick={() =>
                    dispatch(
                      bookCategoriesActions.setSelectedCategoryId(null)
                    )
                  }
                >
                  {t("Barchasi", "Все", "All")}
                </button>
              </li>
              {catLoading && categories.length === 0 ? (
                <li>
                  <div className={s.catSkeleton} />
                  <div className={s.catSkeleton} />
                  <div className={s.catSkeleton} />
                </li>
              ) : (
                categories.map((c) => {
                  const active = c.id === selectedCategoryId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`${s.catItem} ${active ? s.catActive : ""}`}
                        onClick={() =>
                          dispatch(
                            bookCategoriesActions.setSelectedCategoryId(c.id)
                          )
                        }
                      >
                        {pick(c.titleUz, c.titleRu)}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Books grid */}
          <section className={s.main}>
            <h2 className={s.mainTitle}>{sectionTitle}</h2>

            {booksLoading && books.length === 0 ? (
              <div className={s.loader}>
                <Spin size="large" />
              </div>
            ) : books.length === 0 ? (
              <NotFound
                subTitle={t(
                  "Kitoblar topilmadi",
                  "Книги не найдены",
                  "No books found"
                )}
              />
            ) : (
              <div className={s.grid}>
                {books.map((book) => {
                  const price = computeDisplayPrice(book);
                  const discounted = hasDiscount(book);
                  const titleText = pick(book.titleUz, book.titleRu);
                  return (
                    <article key={book.id} className={s.card}>
                      <Link to={`/books/${book.id}`} className={s.cover}>
                        <SafeBookCover
                          src={book.coverImageUrl}
                          alt={titleText}
                          className={s.coverFallback}
                        />
                        {discounted && (
                          <span className={s.discountBadge}>
                            {isPercentDiscountType(book.discountType)
                              ? `-${book.discountPercent}%`
                              : t("Chegirma", "Скидка", "Sale")}
                          </span>
                        )}
                        {book.bookCategory?.categoryType === "KONSPEKT" && (
                          <span className={s.kindBadge}>
                            {t("Konspekt", "Конспект", "Notes")}
                          </span>
                        )}
                      </Link>

                      <div className={s.cardBody}>
                        <div className={s.cardHead}>
                          <Link
                            to={`/books/${book.id}`}
                            className={s.cardTitle}
                          >
                            {titleText}
                          </Link>
                          <button
                            type="button"
                            className={s.heartBtn}
                            aria-label="Favorite"
                          >
                            <HeartOutlined />
                          </button>
                        </div>

                        <div className={s.priceRow}>
                          {discounted && (
                            <span className={s.priceOld}>
                              {formatPrice(book.basePrice, lang)}
                            </span>
                          )}
                          <span className={s.priceNow}>
                            {formatPrice(price, lang)}
                          </span>
                        </div>

                        <button type="button" className={s.buyBtn}>
                          <ShoppingCartOutlined />
                          {t("Sotib olish", "Купить", "Buy")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {booksPagination.total > 0 && (
              <div className={s.paginationWrap}>
                <ModernPagination
                  page={booksPagination.page}
                  pageSize={booksPagination.limit}
                  total={booksPagination.total}
                  onChange={(p) =>
                    dispatch(booksSliceActions.setPage(p))
                  }
                  onPageSizeChange={(size) =>
                    dispatch(booksSliceActions.setLimit(size))
                  }
                  pageSizeOptions={[8, 12, 24, 48]}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </Container>
  );
};

export default BooksPage;
