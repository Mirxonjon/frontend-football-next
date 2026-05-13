"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin, Select, message } from "antd";
import {
  SortAscendingOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import Search from "../../components/ui/Search/Search";
import NotFound from "../../components/ui/404/404";
import ModernPagination from "../../components/ui/ModernPagination/ModernPagination";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";

import {
  fetchMasterclasses,
  fetchMasterclassCategories,
  masterclassActions,
  type Masterclass,
  type MasterclassCategory,
  type MasterclassPagination,
  type MasterclassSortBy,
  type SortOrder,
} from "../../store/masterclass/masterclassSlice";
import s from "./MasterclassPage.module.scss";

const FALLBACK_BG =
  "linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)";

const MasterclassPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  const list = useSelector(
    (state: any) => (state.masterclass?.list ?? []) as Masterclass[]
  );
  const listLoading = useSelector(
    (state: any) => (state.masterclass?.listLoading ?? false) as boolean
  );
  const listError = useSelector(
    (state: any) => (state.masterclass?.listError ?? "") as string
  );
  const categories = useSelector(
    (state: any) =>
      (state.masterclass?.categories ?? []) as MasterclassCategory[]
  );
  const search = useSelector(
    (state: any) => (state.masterclass?.search ?? "") as string
  );
  const selectedCategoryId = useSelector(
    (state: any) =>
      (state.masterclass?.selectedCategoryId ?? null) as number | null
  );
  const pagination = useSelector(
    (state: any) =>
      (state.masterclass?.pagination ?? {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      }) as MasterclassPagination
  );
  const sortBy = useSelector(
    (state: any) =>
      (state.masterclass?.sortBy ?? "id") as MasterclassSortBy
  );
  const sortOrder = useSelector(
    (state: any) => (state.masterclass?.sortOrder ?? "desc") as SortOrder
  );
  const lang = useSelector((state: any) => state.lang.lang);

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  useEffect(() => {
    dispatch(
      fetchMasterclassCategories({
        all: true,
        includeCount: true,
        hasMasterclasses: true,
        sortBy: "masterclassCount",
        sortOrder: "desc",
      })
    );
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchMasterclasses({
        masterclassCategoryId: selectedCategoryId ?? undefined,
        search: search || undefined,
      })
    );
  }, [
    dispatch,
    selectedCategoryId,
    search,
    sortBy,
    sortOrder,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    if (listError) messageApi.error(listError);
  }, [listError, messageApi]);

  const mosaic = useMemo(() => {
    return list.map((m, idx) => {
      const variant =
        idx === 0
          ? "lg"
          : idx === 1 || idx === 4
            ? "md"
            : "sm";
      return { item: m, variant };
    });
  }, [list]);

  return (
    <Container>
      <Helmet>
        <title>CoachingZona — Masterclasslar</title>
        <meta
          name="description"
          content="Taniqli murabbiylarning master-klasslari"
        />
        <link rel="canonical" href="https://coachingzona.uz/masterclass" />
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.pageTitle}>
            {t("Masterclasslar", "Мастер-классы", "Masterclasses")}
          </h1>
          <div className={s.searchBox}>
            <Search
              placeholder={t(
                "Master-klass izlash…",
                "Поиск мастер-класса…",
                "Search masterclass…"
              )}
              value={search}
              onChange={(e: any) =>
                dispatch(masterclassActions.setSearch(e.target.value))
              }
              allowClear
            />
          </div>
        </header>

        <div className={s.filterBar}>
          {categories.length > 0 && (
            <div className={s.filterField}>
              <span className={s.filterLabel}>
                <AppstoreOutlined />
                {t("Kategoriya", "Категория", "Category")}
              </span>
              <Select
                size="middle"
                value={selectedCategoryId ?? "all"}
                onChange={(v) =>
                  dispatch(
                    masterclassActions.setSelectedCategoryId(
                      v === "all" ? null : (v as number)
                    )
                  )
                }
                showSearch
                optionFilterProp="label"
                className={s.filterSelect}
                popupMatchSelectWidth={false}
                options={[
                  {
                    value: "all",
                    label: t("Barchasi", "Все", "All"),
                  },
                  ...categories.map((c) => ({
                    value: c.id,
                    label:
                      typeof c.masterclassCount === "number"
                        ? `${pick(c.titleUz, c.titleRu)} (${c.masterclassCount})`
                        : pick(c.titleUz, c.titleRu),
                  })),
                ]}
              />
            </div>
          )}

          <div className={s.filterField}>
            <span className={s.filterLabel}>
              <SortAscendingOutlined />
              {t("Saralash", "Сортировка", "Sort")}
            </span>
            <Select
              size="middle"
              value={`${sortBy}:${sortOrder}`}
              onChange={(v) => {
                const [sb, so] = v.split(":") as [
                  MasterclassSortBy,
                  SortOrder
                ];
                dispatch(
                  masterclassActions.setSort({ sortBy: sb, sortOrder: so })
                );
              }}
              className={s.filterSelect}
              popupMatchSelectWidth={false}
              options={[
                {
                  value: "id:desc",
                  label: t("Yangilari oldin", "Новые сначала", "Newest first"),
                },
                {
                  value: "id:asc",
                  label: t("Eskilari oldin", "Старые сначала", "Oldest first"),
                },
                {
                  value: "createdAt:desc",
                  label: t(
                    "Sana bo‘yicha (yangi)",
                    "По дате (новые)",
                    "By date (newest)"
                  ),
                },
                {
                  value: "createdAt:asc",
                  label: t(
                    "Sana bo‘yicha (eski)",
                    "По дате (старые)",
                    "By date (oldest)"
                  ),
                },
              ]}
            />
          </div>

          {selectedCategoryId !== null && (
            <button
              type="button"
              className={s.resetBtn}
              onClick={() =>
                dispatch(masterclassActions.setSelectedCategoryId(null))
              }
            >
              {t("Tozalash", "Сбросить", "Reset")}
            </button>
          )}
        </div>

        <div className={s.layout}>
          <main className={s.mainCol}>
            {listLoading && list.length === 0 ? (
              <div className={s.loader}>
                <Spin size="large" />
              </div>
            ) : list.length === 0 ? (
              <NotFound
                subTitle={t(
                  "Master-klasslar topilmadi",
                  "Мастер-классы не найдены",
                  "No masterclasses found"
                )}
              />
            ) : (
              <div className={s.mosaic}>
                {mosaic.map(({ item, variant }) => {
                  const title = pick(item.titleUz, item.titleRu);
                  const cover = item.masterclassCategory?.imageUrl;
                  const isUrl =
                    typeof cover === "string" &&
                    (cover.startsWith("http://") ||
                      cover.startsWith("https://"));
                  return (
                    <Link
                      to={`/masterclass/${item.id}`}
                      key={item.id}
                      className={`${s.tile} ${s[`tile_${variant}`]}`}
                    >
                      <div
                        className={s.tileImg}
                        style={
                          isUrl
                            ? { backgroundImage: `url("${cover}")` }
                            : { background: FALLBACK_BG }
                        }
                      />
                      <div className={s.tileBody}>
                        <span className={s.tileKind}>
                          {t("Masterclass", "Мастер-класс", "Masterclass")}
                        </span>
                        <h3 className={s.tileTitle}>{title}</h3>
                        {variant === "lg" &&
                          item.masterclassCategory &&
                          (item.masterclassCategory.descriptionUz ||
                            item.masterclassCategory.descriptionRu) && (
                            <p className={s.tileDesc}>
                              {pick(
                                item.masterclassCategory.descriptionUz,
                                item.masterclassCategory.descriptionRu
                              )}
                            </p>
                          )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {pagination.total > 0 && (
              <div className={s.paginationWrap}>
                <ModernPagination
                  page={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  onChange={(p) => dispatch(masterclassActions.setPage(p))}
                  onPageSizeChange={(size) =>
                    dispatch(masterclassActions.setLimit(size))
                  }
                  pageSizeOptions={[8, 12, 24, 48]}
                />
              </div>
            )}
          </main>

          <aside className={s.sidebar}>
            <div className={s.sideTitle}>
              {t("Taniqli murabbiylar", "Известные тренеры", "Notable coaches")}
            </div>
            {list.length === 0 ? (
              <div className={s.sideEmpty}>—</div>
            ) : (
              <ul className={s.sideList}>
                {list.slice(0, 12).map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/masterclass/${m.id}`}
                      className={s.sideItem}
                    >
                      <span className={s.sideName}>
                        {pick(m.titleUz, m.titleRu)}
                      </span>
                      <span className={s.sideKind}>
                        {t("Masterclass", "Мастер-класс", "Masterclass")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
};

export default MasterclassPage;
