"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PlayCircleFilled,
  ArrowRightOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { Link } from "@/lib/router-compat";
import {
  fetchMyProgressList,
  type LessonProgress,
} from "../../../store/lessonProgress/lessonProgressSlice";
import s from "./ContinueWatching.module.scss";

type Props = {
  lang: "uz" | "ru" | "en";
};

const ContinueWatching = ({ lang }: Props) => {
  const dispatch = useDispatch<any>();

  // Anonymous users: no token → endpoint returns 401 → slice keeps an empty
  // list and we render nothing. Cheap to dispatch unconditionally.
  const tokenPresent = useSelector(() => {
    if (typeof window === "undefined") return false;
    try {
      return Boolean(window.localStorage.getItem("token"));
    } catch {
      return false;
    }
  });

  const list = useSelector(
    (state: any) =>
      (state.lessonProgress?.list ?? []) as LessonProgress[]
  );
  const loading = useSelector(
    (state: any) => (state.lessonProgress?.listLoading ?? false) as boolean
  );

  useEffect(() => {
    if (!tokenPresent) return;
    dispatch(fetchMyProgressList());
  }, [dispatch, tokenPresent]);

  // Show only in-progress lessons, most recently updated first, top 6.
  const items = useMemo(() => {
    return list
      .filter((p) => !p.isCompleted && p.lastBlockSequence > 0)
      .slice()
      .sort((a, b) => {
        const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return bt - at;
      })
      .slice(0, 6);
  }, [list]);

  if (!tokenPresent) return null;
  if (!loading && items.length === 0) return null;

  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;
  const pickTitle = (p: LessonProgress) =>
    lang === "ru"
      ? p.lesson?.titleRu || p.lesson?.titleUz || ""
      : p.lesson?.titleUz || p.lesson?.titleRu || "";

  return (
    <section className={s.wrap}>
      <header className={s.head}>
        <div>
          <h2 className={s.title}>
            <PlayCircleFilled className={s.titleIcon} />
            {t("Davom etish", "Продолжить просмотр", "Continue watching")}
          </h2>
          <p className={s.sub}>
            {t(
              "Boshlagan darslaringiz",
              "Уроки, которые вы начали",
              "Lessons you started"
            )}
          </p>
        </div>
        <Link to="/training" className={s.seeAll}>
          {t("Barcha mashgʻulotlar", "Все тренировки", "All trainings")}
          <ArrowRightOutlined />
        </Link>
      </header>

      <div className={s.row}>
        {loading && items.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className={s.skeleton} />
            ))
          : items.map((p) => {
              const title = pickTitle(p);
              return (
                <Link
                  key={p.lessonId}
                  to={`/lessons/${p.lessonId}`}
                  className={s.card}
                >
                  <div className={s.thumb}>
                    <PlayCircleFilled className={s.thumbIcon} />
                  </div>
                  <div className={s.body}>
                    <h3 className={s.cardTitle}>
                      {title || `Lesson #${p.lessonId}`}
                    </h3>
                    <div className={s.meta}>
                      <CheckCircleFilled className={s.checkIcon} />
                      {t(
                        `${p.lastBlockSequence} blok koʻrilgan`,
                        `Просмотрено ${p.lastBlockSequence} блоков`,
                        `${p.lastBlockSequence} block${p.lastBlockSequence === 1 ? "" : "s"} watched`
                      )}
                    </div>
                  </div>
                  <span className={s.continueBtn}>
                    {t("Davom etish", "Продолжить", "Resume")}
                    <ArrowRightOutlined />
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
};

export default ContinueWatching;
