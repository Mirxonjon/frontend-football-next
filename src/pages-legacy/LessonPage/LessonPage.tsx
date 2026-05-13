"use client";

import { Helmet } from "@/lib/helmet-compat";
import Container from "../../components/ui/Container/Container";
import s from "./LessonPage.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { useParams, Link } from "@/lib/router-compat";
import { Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import NotFound from "../../components/ui/404/404";
import BlocksList from "../../components/ui/BlocksList/BlocksList";
import {
  fetchLessonById,
  type Lesson,
} from "../../store/lessons/lessonsSlice";

const LessonPage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const [messageApi, contextHolder] = message.useMessage();

  const current = useSelector(
    (state: any) => state.lessons.current as Lesson | null
  );
  const loading = useSelector(
    (state: any) => state.lessons.currentLoading as boolean
  );
  const error = useSelector(
    (state: any) => state.lessons.currentError as string
  );
  const lang = useSelector((state: any) => state.lang.lang);

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  // One-shot URL-refresh guard — prevents loops when video URLs are bogus.
  const refreshedRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      refreshedRef.current = null;
      dispatch(fetchLessonById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  // Re-fetch lesson to get fresh signed URLs when a video reports 403.
  // Per-lesson one-shot — prevents infinite refresh on truly broken URLs.
  const handleUrlExpired = () => {
    if (!id) return;
    if (refreshedRef.current === id) return;
    refreshedRef.current = id;
    dispatch(fetchLessonById(id));
  };

  if (loading && !current) {
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
          subTitle={t("Dars topilmadi", "Урок не найден", "Lesson not found")}
        />
      </Container>
    );
  }

  const title = pick(current.titleUz, current.titleRu);
  const categoryTitle = current.trainingCategory
    ? pick(current.trainingCategory.titleUz, current.trainingCategory.titleRu)
    : null;

  return (
    <Container>
      <Helmet>
        <title>{`${title} — CoachingZona`}</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link
          to={
            current.trainingCategoryId
              ? `/training/${current.trainingCategoryId}`
              : "/training"
          }
          className={s.back}
        >
          <ArrowLeftOutlined />
          <span>
            {categoryTitle ??
              t("Kursga qaytish", "К курсу", "Back to course")}
          </span>
        </Link>

        <header className={s.header}>
          <h1 className={s.title}>{title}</h1>
        </header>

        <BlocksList
          lesson={current}
          loading={loading}
          lang={lang}
          onUrlExpired={handleUrlExpired}
        />
      </div>
    </Container>
  );
};

export default LessonPage;
