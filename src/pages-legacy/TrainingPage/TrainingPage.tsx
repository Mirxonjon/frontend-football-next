"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Segmented, Switch, Spin, Select, message } from "antd";
import ModernPagination from "../../components/ui/ModernPagination/ModernPagination";
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  LockOutlined,
  ThunderboltFilled,
  VideoCameraOutlined,
  SortAscendingOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

import AgesCategory from "../../components/ui/AgesCategory/AgesCategory";
import Category from "../../components/ui/Category/Category";
import LessonsList from "../../components/ui/LessonsList/LessonsList";
import Container from "../../components/ui/Container/Container";
import Search from "../../components/ui/Search/Search";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";

import {
  fetchTrainingCategories,
  seedAgeCategoryOptions,
  treningCategoryActions,
  type AgeCategory,
  type TrainingCategory,
  type TrainingViewMode,
  type Pagination as PaginationType,
  type CategorySortBy,
  type SortOrder,
  type CategoryProgressStatus,
} from "../../store/trening/treningCategoriesSlice";
import {
  fetchLessons,
  lessonsActions,
  type Lesson,
  type LessonsPagination,
  type LessonSortBy,
  type ProgressStatus,
} from "../../store/lessons/lessonsSlice";
import s from "./TrainingPage.module.scss";

const TrainingPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  const items = useSelector(
    (state: any) => state.treningCategory.items as TrainingCategory[]
  );
  const loading = useSelector((state: any) => state.treningCategory.loading);
  const error = useSelector((state: any) => state.treningCategory.error);
  const selectedAgeId = useSelector(
    (state: any) => state.treningCategory.selectedAgeId as number | null
  );
  const search = useSelector(
    (state: any) => state.treningCategory.search as string
  );
  const viewMode = useSelector(
    (state: any) => state.treningCategory.viewMode as TrainingViewMode
  );
  const freeOnly = useSelector(
    (state: any) => state.treningCategory.freeOnly as boolean
  );
  const unlockedOnly = useSelector(
    (state: any) => state.treningCategory.unlockedOnly as boolean
  );
  const pagination = useSelector(
    (state: any) => state.treningCategory.pagination as PaginationType
  );
  const ageOptionsLoaded = useSelector(
    (state: any) => state.treningCategory.ageOptionsLoaded as boolean
  );
  const ageCategoryOptions = useSelector(
    (state: any) => state.treningCategory.ageCategoryOptions as AgeCategory[]
  );
  const catSortBy = useSelector(
    (state: any) => state.treningCategory.sortBy as CategorySortBy
  );
  const catSortOrder = useSelector(
    (state: any) => state.treningCategory.sortOrder as SortOrder
  );
  const hasLessonsFlag = useSelector(
    (state: any) => state.treningCategory.hasLessons as boolean
  );
  const catProgressStatus = useSelector(
    (state: any) =>
      state.treningCategory.progressStatus as CategoryProgressStatus | null
  );

  const lessons = useSelector(
    (state: any) => state.lessons.list as Lesson[]
  );
  const lessonsLoading = useSelector(
    (state: any) => state.lessons.listLoading as boolean
  );
  const lessonsError = useSelector(
    (state: any) => state.lessons.listError as string
  );
  const lessonsPagination = useSelector(
    (state: any) => state.lessons.pagination as LessonsPagination
  );
  const lessonsSortBy = useSelector(
    (state: any) => state.lessons.sortBy as LessonSortBy
  );
  const lessonsSortOrder = useSelector(
    (state: any) => state.lessons.sortOrder as SortOrder
  );
  const progressStatus = useSelector(
    (state: any) => state.lessons.progressStatus as ProgressStatus | null
  );
  const hasVideo = useSelector(
    (state: any) => state.lessons.hasVideo as boolean
  );

  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  // Seed age category options once (independent of pagination)
  useEffect(() => {
    if (!ageOptionsLoaded) {
      dispatch(seedAgeCategoryOptions());
    }
  }, [dispatch, ageOptionsLoaded]);

  // Fetch categories (paginated, server-side filters) when in categories mode.
  useEffect(() => {
    if (viewMode !== "categories") return;
    dispatch(fetchTrainingCategories(undefined));
  }, [
    dispatch,
    viewMode,
    selectedAgeId,
    search,
    pagination.page,
    pagination.limit,
    catSortBy,
    catSortOrder,
    hasLessonsFlag,
    catProgressStatus,
  ]);

  // Reset lessons page when filters change
  useEffect(() => {
    if (viewMode !== "lessons") return;
    dispatch(lessonsActions.resetPage());
  }, [dispatch, viewMode, selectedAgeId, search, freeOnly, unlockedOnly]);

  // Fetch lessons when in lessons mode (server-side filters + pagination)
  useEffect(() => {
    if (viewMode !== "lessons") return;
    dispatch(
      fetchLessons({
        ageCategoryId: selectedAgeId ?? undefined,
        search: search || undefined,
        isFree: freeOnly || undefined,
        unlocked: unlockedOnly || undefined,
        hasVideo: hasVideo || undefined,
      })
    );
  }, [
    dispatch,
    viewMode,
    selectedAgeId,
    search,
    freeOnly,
    unlockedOnly,
    hasVideo,
    progressStatus,
    lessonsSortBy,
    lessonsSortOrder,
    lessonsPagination.page,
    lessonsPagination.limit,
  ]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  // Use seeded ages if loaded, else derive from current page items
  const ageCategories = useMemo<AgeCategory[]>(() => {
    if (ageOptionsLoaded && ageCategoryOptions.length) {
      return ageCategoryOptions;
    }
    const map = new Map<number, AgeCategory>();
    items.forEach((it) => {
      if (it.ageCategory && !map.has(it.ageCategory.id)) {
        map.set(it.ageCategory.id, it.ageCategory);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.minAge - b.minAge);
  }, [ageOptionsLoaded, ageCategoryOptions, items]);

  // Server now applies isFree / unlocked filters; just use the list as-is.
  const filteredLessons = lessons;

  const placeholder =
    viewMode === "categories"
      ? t("Mashgʻulot izlash…", "Поиск тренировок…", "Search trainings…")
      : t("Dars izlash…", "Поиск уроков…", "Search lessons…");

  const isAuthError =
    lessonsError && /401|unauth|subscri/i.test(lessonsError);

  const activeFilterCount =
    (selectedAgeId !== null ? 1 : 0) +
    (search ? 1 : 0) +
    (viewMode === "lessons" && freeOnly ? 1 : 0) +
    (viewMode === "lessons" && unlockedOnly ? 1 : 0) +
    (viewMode === "lessons" && hasVideo ? 1 : 0) +
    (viewMode === "lessons" && progressStatus !== null ? 1 : 0) +
    (viewMode === "categories" && hasLessonsFlag ? 1 : 0) +
    (viewMode === "categories" && catProgressStatus !== null ? 1 : 0);

  const resetFilters = () => {
    dispatch(treningCategoryActions.setSelectedAge(null));
    dispatch(treningCategoryActions.setSearch(""));
    dispatch(treningCategoryActions.setFreeOnly(false));
    dispatch(treningCategoryActions.setUnlockedOnly(false));
    dispatch(treningCategoryActions.setHasLessons(false));
    dispatch(treningCategoryActions.setCategoryProgressStatus(null));
    dispatch(lessonsActions.setHasVideo(false));
    dispatch(lessonsActions.setProgressStatus(null));
  };

  // Sort dropdown options
  const catSortOptions = [
    {
      value: "id:desc",
      label: t("Yangilari oldin", "Новые сначала", "Newest first"),
    },
    {
      value: "createdAt:asc",
      label: t("Eskilari oldin", "Старые сначала", "Oldest first"),
    },
    {
      value: "lessonCount:desc",
      label: t("Koʻp darslar", "Больше уроков", "More lessons"),
    },
    {
      value: "lessonCount:asc",
      label: t("Kam darslar", "Меньше уроков", "Fewer lessons"),
    },
  ];

  const lessonSortOptions = [
    {
      value: "id:desc",
      label: t("Yangilari oldin", "Новые сначала", "Newest first"),
    },
    {
      value: "createdAt:asc",
      label: t("Eskilari oldin", "Старые сначала", "Oldest first"),
    },
  ];

  return (
    <Container>
      <Helmet>
        <title>Mashgʻulotlar — Coach Hub</title>
        <meta
          name="description"
          content="Coach Hub — murabbiylar uchun futbol mashgʻulotlari boʻlimi. Yosh guruhlari, taktika, texnika va amaliy darslar."
        />
        <link rel="canonical" href="https://coaching-center.uz/training" />
      </Helmet>

      <div className={s.wrapper}>
        {contextHolder}

        <header className={s.pageHeader}>
          <h1 className={s.pageTitle}>
            {t("Mashgʻulotlar", "Тренировки", "Trainings")}
          </h1>
          <div className={s.searchBox}>
            <Search
              placeholder={placeholder}
              value={search}
              onChange={(e: any) =>
                dispatch(treningCategoryActions.setSearch(e.target.value))
              }
              allowClear
            />
          </div>
        </header>

        <div className={s.filterPanel}>
          <div className={s.row1}>
            <Segmented
              value={viewMode}
              onChange={(v) =>
                dispatch(
                  treningCategoryActions.setViewMode(v as TrainingViewMode)
                )
              }
              options={[
                {
                  value: "categories",
                  label: (
                    <span className={s.segLabel}>
                      <AppstoreOutlined />{" "}
                      {t("Kategoriyalar", "Категории", "Categories")}
                    </span>
                  ),
                },
                {
                  value: "lessons",
                  label: (
                    <span className={s.segLabel}>
                      <PlayCircleOutlined />{" "}
                      {t("Darslar", "Уроки", "Lessons")}
                    </span>
                  ),
                },
              ]}
              size="large"
            />

            {activeFilterCount > 0 && (
              <button
                type="button"
                className={s.resetBtn}
                onClick={resetFilters}
              >
                {t("Tozalash", "Сбросить", "Reset")}
                <span className={s.resetCount}>{activeFilterCount}</span>
              </button>
            )}
          </div>

          <div className={s.divider} />

          <div className={s.row2}>
            <div className={s.ageWrap}>
              <AgesCategory ageCategories={ageCategories} />
            </div>

            {viewMode === "lessons" && (
              <div className={s.toggles}>
                {/* Toggles use <div role="button"> instead of <button> because
                    AntD's <Switch> renders its own <button>, and nesting
                    buttons in HTML is invalid. */}
                <div
                  role="button"
                  tabIndex={0}
                  className={`${s.toggle} ${freeOnly ? s.toggleActive : ""}`}
                  onClick={() =>
                    dispatch(treningCategoryActions.setFreeOnly(!freeOnly))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch(treningCategoryActions.setFreeOnly(!freeOnly));
                    }
                  }}
                >
                  <ThunderboltFilled />
                  <span>{t("Bepul", "Бесплатно", "Free")}</span>
                  <Switch checked={freeOnly} size="small" />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`${s.toggle} ${unlockedOnly ? s.toggleActive : ""}`}
                  onClick={() =>
                    dispatch(
                      treningCategoryActions.setUnlockedOnly(!unlockedOnly)
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch(
                        treningCategoryActions.setUnlockedOnly(!unlockedOnly)
                      );
                    }
                  }}
                >
                  <LockOutlined />
                  <span>
                    {t("Ochilganlar", "Открытые", "Unlocked")}
                  </span>
                  <Switch checked={unlockedOnly} size="small" />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`${s.toggle} ${hasVideo ? s.toggleActive : ""}`}
                  onClick={() =>
                    dispatch(lessonsActions.setHasVideo(!hasVideo))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch(lessonsActions.setHasVideo(!hasVideo));
                    }
                  }}
                >
                  <VideoCameraOutlined />
                  <span>
                    {t("Video bilan", "С видео", "With video")}
                  </span>
                  <Switch checked={hasVideo} size="small" />
                </div>
              </div>
            )}

            {viewMode === "categories" && (
              <div className={s.toggles}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`${s.toggle} ${hasLessonsFlag ? s.toggleActive : ""}`}
                  onClick={() =>
                    dispatch(
                      treningCategoryActions.setHasLessons(!hasLessonsFlag)
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch(
                        treningCategoryActions.setHasLessons(!hasLessonsFlag)
                      );
                    }
                  }}
                >
                  <FolderOpenOutlined />
                  <span>
                    {t(
                      "Faqat darsi borlar",
                      "Только с уроками",
                      "With lessons only"
                    )}
                  </span>
                  <Switch checked={hasLessonsFlag} size="small" />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: progress tabs (both modes) + sort dropdown */}
          <div className={s.row3}>
            {viewMode === "lessons" ? (
              <Segmented
                value={progressStatus ?? "all"}
                onChange={(v) =>
                  dispatch(
                    lessonsActions.setProgressStatus(
                      v === "all" ? null : (v as ProgressStatus)
                    )
                  )
                }
                options={[
                  {
                    value: "all",
                    label: t("Barchasi", "Все", "All"),
                  },
                  {
                    value: "not_started",
                    label: t("Boshlanmagan", "Не начат", "Not started"),
                  },
                  {
                    value: "in_progress",
                    label: t("Davom etayotgan", "В процессе", "In progress"),
                  },
                  {
                    value: "completed",
                    label: t("Tugatilgan", "Завершён", "Completed"),
                  },
                ]}
                size="small"
              />
            ) : (
              <Segmented
                value={catProgressStatus ?? "all"}
                onChange={(v) =>
                  dispatch(
                    treningCategoryActions.setCategoryProgressStatus(
                      v === "all" ? null : (v as CategoryProgressStatus)
                    )
                  )
                }
                options={[
                  {
                    value: "all",
                    label: t("Barchasi", "Все", "All"),
                  },
                  {
                    value: "not_started",
                    label: t("Boshlanmagan", "Не начат", "Not started"),
                  },
                  {
                    value: "in_progress",
                    label: t("Davom etayotgan", "В процессе", "In progress"),
                  },
                  {
                    value: "completed",
                    label: t("Tugatilgan", "Завершён", "Completed"),
                  },
                ]}
                size="small"
              />
            )}

            <div className={s.sortGroup}>
              <SortAscendingOutlined className={s.sortIcon} />
              {viewMode === "categories" ? (
                <Select
                  size="small"
                  value={`${catSortBy}:${catSortOrder}`}
                  onChange={(v) => {
                    const [sortBy, sortOrder] = v.split(":") as [
                      CategorySortBy,
                      SortOrder
                    ];
                    dispatch(
                      treningCategoryActions.setSort({ sortBy, sortOrder })
                    );
                  }}
                  options={catSortOptions}
                  style={{ minWidth: 180 }}
                  variant="borderless"
                />
              ) : (
                <Select
                  size="small"
                  value={`${lessonsSortBy}:${lessonsSortOrder}`}
                  onChange={(v) => {
                    const [sortBy, sortOrder] = v.split(":") as [
                      LessonSortBy,
                      SortOrder
                    ];
                    dispatch(lessonsActions.setSort({ sortBy, sortOrder }));
                  }}
                  options={lessonSortOptions}
                  style={{ minWidth: 180 }}
                  variant="borderless"
                />
              )}
            </div>
          </div>
        </div>

        {viewMode === "categories" ? (
          loading && items.length === 0 ? (
            <div className={s.loader}>
              <Spin size="large" />
            </div>
          ) : items.length ? (
            <>
              <Category category={items} />
              {pagination.total > 0 && (
                <div className={s.paginationWrap}>
                  <ModernPagination
                    page={pagination.page}
                    pageSize={pagination.limit}
                    total={pagination.total}
                    onChange={(p) =>
                      dispatch(treningCategoryActions.setPage(p))
                    }
                    onPageSizeChange={(size) =>
                      dispatch(treningCategoryActions.setLimit(size))
                    }
                    pageSizeOptions={[8, 12, 24, 48]}
                  />
                </div>
              )}
            </>
          ) : (
            <NotFound
              subTitle={
                t("Hech narsa topilmadi", "Ничего не найдено", "Nothing found")
              }
            />
          )
        ) : lessonsLoading ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : isAuthError ? (
          <div className={s.authBox}>
            <LockOutlined className={s.lockIcon} />
            <div>
              {t(
                "Darslarni koʻrish uchun tizimga kiring",
                "Войдите, чтобы увидеть уроки",
                "Sign in to view the lessons"
              )}
            </div>
          </div>
        ) : filteredLessons.length ? (
          <>
            <LessonsList lessons={filteredLessons} />
            {lessonsPagination.total > 0 && (
              <div className={s.paginationWrap}>
                <ModernPagination
                  page={lessonsPagination.page}
                  pageSize={lessonsPagination.limit}
                  total={lessonsPagination.total}
                  onChange={(p) => dispatch(lessonsActions.setPage(p))}
                  onPageSizeChange={(size) =>
                    dispatch(lessonsActions.setLimit(size))
                  }
                  pageSizeOptions={[8, 12, 24, 48]}
                />
              </div>
            )}
          </>
        ) : (
          <NotFound
            subTitle={
              t("Darslar topilmadi", "Уроки не найдены", "No lessons found")
            }
          />
        )}
      </div>
    </Container>
  );
};

export default TrainingPage;
