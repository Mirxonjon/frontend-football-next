"use client";

import { Link } from "@/lib/router-compat";
import { useSelector } from "react-redux";
import { LockOutlined, RightOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { Lesson } from "../../../store/lessons/lessonsSlice";
import s from "./LessonsList.module.scss";

type Props = {
  lessons: Lesson[];
};

const LessonsList = ({ lessons }: Props) => {
  const lang = useSelector((state: any) => state.lang.lang);
  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);

  if (lessons.length === 0) return null;

  return (
    <div className={s.wrapper}>
      <h2 className={s.title}>
        {lang === "ru"
          ? "Все уроки"
          : lang === "en"
            ? "All lessons"
            : "Barcha darslar"}
        <span className={s.count}>{lessons.length}</span>
      </h2>

      <div className={s.grid}>
        {lessons.map((lesson) => {
          const lessonTitle = pick(lesson.titleUz, lesson.titleRu);
          const categoryTitle = lesson.trainingCategory
            ? pick(
                lesson.trainingCategory.titleUz,
                lesson.trainingCategory.titleRu
              )
            : null;
          const ageRange = lesson.trainingCategory?.ageCategory
            ? `${lesson.trainingCategory.ageCategory.minAge}–${lesson.trainingCategory.ageCategory.maxAge}`
            : null;
          const locked = lesson.isLocked && !lesson.isFree;

          return (
            <Link
              to={`/lessons/${lesson.id}`}
              key={lesson.id}
              className={`${s.card} ${locked ? s.locked : ""}`}
            >
              <div className={s.thumb}>
                <PlayCircleOutlined />
                {ageRange && <span className={s.ageBadge}>{ageRange}</span>}
                {lesson.isFree && (
                  <span className={s.freeBadge}>
                    {lang === "ru" ? "Бесплатно" : lang === "en" ? "Free" : "Bepul"}
                  </span>
                )}
                {locked && (
                  <span className={s.lockBadge}>
                    <LockOutlined />
                  </span>
                )}
              </div>
              <div className={s.body}>
                {categoryTitle && (
                  <div className={s.cat}>{categoryTitle}</div>
                )}
                <div className={s.name}>{lessonTitle}</div>
              </div>
              <RightOutlined className={s.arrow} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LessonsList;
