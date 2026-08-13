"use client";

import { Helmet } from "@/lib/helmet-compat";
import Container from "../../components/ui/Container/Container";
import s from "./TraningVideoPage.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "@/lib/router-compat";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  LockOutlined,
  CaretRightFilled,
  PauseOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import NotFound from "../../components/ui/404/404";
import BlocksList from "../../components/ui/BlocksList/BlocksList";
import {
  fetchTrainingCategoryById,
  type TrainingCategory,
} from "../../store/trening/treningCategoriesSlice";
import {
  fetchLessons,
  fetchLessonById,
  type Lesson,
} from "../../store/lessons/lessonsSlice";
import {
  fetchMyProgressList,
  type LessonProgress,
} from "../../store/lessonProgress/lessonProgressSlice";

const TraningVideoPage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ id?: string }>();
  const id = params?.id;

  const [messageApi, contextHolder] = message.useMessage();
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  // Per-lesson lock so that even if VideoPlayer remounts, we never
  // re-trigger auto-refresh more than once for the same lesson id.
  const refreshedLessonIdsRef = useRef<Set<number>>(new Set());

  const current = useSelector(
    (state: any) => state.treningCategory.current as TrainingCategory | null
  );
  const loading = useSelector(
    (state: any) => state.treningCategory.currentLoading as boolean
  );
  const error = useSelector(
    (state: any) => state.treningCategory.currentError as string
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
  const currentLesson = useSelector(
    (state: any) => state.lessons.current as Lesson | null
  );
  const currentLessonLoading = useSelector(
    (state: any) => state.lessons.currentLoading as boolean
  );
  const lang = useSelector((state: any) => state.lang.lang);
  const progressByLesson = useSelector(
    (state: any) =>
      (state.lessonProgress?.byLesson ?? {}) as Record<number, LessonProgress>
  );

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  useEffect(() => {
    if (!id) return;
    dispatch(fetchTrainingCategoryById(id));
    dispatch(fetchLessons({ trainingCategoryId: Number(id) }));
    // Hydrate the sidebar progress dots; quietly fails for anonymous /
    // no-subscription users.
    dispatch(fetchMyProgressList());
  }, [dispatch, id]);

  // Auto-select first lesson when lessons load
  useEffect(() => {
    if (lessons.length === 0) {
      setSelectedLessonId(null);
      return;
    }
    if (selectedLessonId == null || !lessons.find((l) => l.id === selectedLessonId)) {
      const firstUnlocked = lessons.find((l) => !l.isLocked || l.isFree);
      setSelectedLessonId((firstUnlocked ?? lessons[0]).id);
    }
  }, [lessons, selectedLessonId]);

  // Fetch the selected lesson's blocks (and reset URL-refresh lock per lesson)
  useEffect(() => {
    if (selectedLessonId != null) {
      refreshedLessonIdsRef.current.delete(selectedLessonId);
      dispatch(fetchLessonById(selectedLessonId));
    }
  }, [dispatch, selectedLessonId]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  if (loading) {
    return (
      <Container>
        <div className={s.loader}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  if (!current) {
    return (
      <Container>
        {contextHolder}
        <NotFound
          style={{ margin: "60px 0" }}
          subTitle={
            t(
              "Kategoriya topilmadi",
              "Категория не найдена",
              "Category not found"
            )
          }
        />
      </Container>
    );
  }

  const title = pick(current.titleUz, current.titleRu);
  const description = pick(current.descriptionUz, current.descriptionRu);
  const isAuthError = lessonsError && /401|unauth|subscri/i.test(lessonsError);

  return (
    <Container>
      <Helmet>
        <title>{`${title} — Coach Hub`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://coaching-center.uz/training" />
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/training" className={s.back}>
          <ArrowLeftOutlined />
          <span>{title}</span>
        </Link>

        <div className={s.layout}>
          {/* LEFT — selected lesson content */}
          <div className={s.left}>
            {isAuthError ? (
              <div className={s.authBox}>
                <LockOutlined className={s.authIcon} />
                <h3>
                  {t(
                    "Darslarni koʻrish uchun tizimga kiring",
                    "Войдите, чтобы смотреть уроки",
                    "Sign in to watch the lessons"
                  )}
                </h3>
                <Link to="/login" className={s.authBtn}>
                  {t("Kirish", "Войти", "Sign in")}
                </Link>
              </div>
            ) : lessonsLoading && lessons.length === 0 ? (
              <div className={s.loaderInline}>
                <Spin />
              </div>
            ) : lessons.length === 0 ? (
              <div className={s.placeholder}>
                {t(
                  "Darslar tez orada qoʻshiladi",
                  "Уроки скоро появятся",
                  "Lessons coming soon"
                )}
              </div>
            ) : (
              <>
                {currentLesson && (
                  <h2 className={s.lessonTitle}>
                    {pick(currentLesson.titleUz, currentLesson.titleRu)}
                  </h2>
                )}
                <BlocksList
                  lesson={currentLesson}
                  loading={currentLessonLoading}
                  lang={lang}
                  onUrlExpired={() => {
                    if (selectedLessonId == null) return;
                    if (refreshedLessonIdsRef.current.has(selectedLessonId)) {
                      // already attempted — do not loop
                      return;
                    }
                    refreshedLessonIdsRef.current.add(selectedLessonId);
                    dispatch(fetchLessonById(selectedLessonId));
                  }}
                />
                {lessons.length > 1 && selectedLessonId != null && (() => {
                  const idx = lessons.findIndex((l) => l.id === selectedLessonId);
                  const prev = idx > 0 ? lessons[idx - 1] : null;
                  const next =
                    idx >= 0 && idx < lessons.length - 1
                      ? lessons[idx + 1]
                      : null;
                  return (
                    <div className={s.lessonNav}>
                      <button
                        type="button"
                        className={`${s.navBtn} ${!prev ? s.navDisabled : ""}`}
                        onClick={() => prev && setSelectedLessonId(prev.id)}
                        disabled={!prev}
                      >
                        <ArrowLeftOutlined />
                        <span className={s.navInner}>
                          <span className={s.navLabel}>
                            {t("Oldingi", "Предыдущий", "Previous")}
                          </span>
                          {prev && (
                            <span className={s.navTitle}>
                              {pick(prev.titleUz, prev.titleRu)}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`${s.navBtn} ${s.navNext} ${!next ? s.navDisabled : ""}`}
                        onClick={() => next && setSelectedLessonId(next.id)}
                        disabled={!next}
                      >
                        <span className={s.navInner}>
                          <span className={s.navLabel}>
                            {t("Keyingi", "Следующий", "Next")}
                          </span>
                          {next && (
                            <span className={s.navTitle}>
                              {pick(next.titleUz, next.titleRu)}
                            </span>
                          )}
                        </span>
                        <ArrowRightOutlined />
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* RIGHT — lessons sidebar */}
          <aside className={s.sidebar}>
            <div className={s.sidebarHeader}>
              <PlayCircleOutlined />
              <span>
                {t(
                  "Video darslar toʻplami",
                  "Сборник видеоуроков",
                  "Video lessons collection"
                )}
              </span>
              {lessons.length > 0 && (
                <span className={s.sidebarCount}>{lessons.length}</span>
              )}
            </div>

            {lessonsLoading && lessons.length === 0 ? (
              <div className={s.loaderInline}>
                <Spin />
              </div>
            ) : (
              <ul className={s.lessonList}>
                {lessons.map((lesson) => {
                  const lessonTitle = pick(lesson.titleUz, lesson.titleRu);
                  const locked = lesson.isLocked && !lesson.isFree;
                  const active = lesson.id === selectedLessonId;
                  const progress = progressByLesson[lesson.id];
                  const completed = Boolean(progress?.isCompleted);
                  const inProgress =
                    !completed && (progress?.lastBlockSequence ?? 0) > 0;
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`${s.lessonItem} ${active ? s.active : ""} ${locked ? s.locked : ""} ${completed ? s.completed : ""}`}
                      >
                        <span className={s.playDot}>
                          {completed ? (
                            <CheckCircleFilled />
                          ) : active ? (
                            <PauseOutlined />
                          ) : (
                            <CaretRightFilled />
                          )}
                        </span>
                        <span className={s.lessonTitle}>{lessonTitle}</span>
                        {inProgress && !locked && (
                          <span
                            className={s.lessonMeta}
                            title={t(
                              `${progress!.lastBlockSequence} blok koʻrilgan`,
                              `Просмотрено ${progress!.lastBlockSequence} блоков`,
                              `${progress!.lastBlockSequence} block(s) watched`
                            )}
                          >
                            <span className={s.progressDot} />
                          </span>
                        )}
                        {locked && (
                          <span className={s.lessonMeta}>
                            <LockOutlined className={s.lockIcon} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
};

export default TraningVideoPage;
