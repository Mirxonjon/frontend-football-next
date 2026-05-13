"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "@/lib/router-compat";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  PictureOutlined,
  PaperClipOutlined,
  BulbOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import VideoPlayer from "../../components/ui/VideoPlayer/VideoPlayer";
import { Helmet } from "@/lib/helmet-compat";

import {
  fetchMasterclassById,
  fetchMasterclasses,
  type Masterclass,
  type MasterclassBlock,
  type MasterclassDetail,
} from "../../store/masterclass/masterclassSlice";
import s from "./MasterclassSinglePage.module.scss";

const isAbsoluteUrl = (u: string | null | undefined): u is string =>
  typeof u === "string" &&
  (u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("blob:"));

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

const Block = ({
  block,
  lang,
}: {
  block: MasterclassBlock;
  lang: string;
}) => {
  const content = lang === "ru" ? block.contentRu : block.contentUz;
  switch (block.blockType) {
    case "TITLE":
      return <h2 className={s.bTitle}>{content}</h2>;
    case "TEXT":
      return (
        <div className={s.bText}>
          {content.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      );
    case "VIDEO":
      return isAbsoluteUrl(content) ? (
        <div className={s.bVideo}>
          <VideoPlayer src={content} duration={block.duration} />
        </div>
      ) : (
        <div className={s.bMissing}>
          <PlayCircleOutlined /> {lang === "ru" ? "Видео" : lang === "en" ? "Video" : "Video"}
        </div>
      );
    case "IMAGE":
      return isAbsoluteUrl(content) ? (
        <SafeImg
          src={content}
          alt="masterclass"
          className={s.bImage}
          fallback={
            <div className={s.bMissing}>
              <PictureOutlined />
            </div>
          }
        />
      ) : (
        <div className={s.bMissing}>
          <PictureOutlined />
        </div>
      );
    case "FILE":
      return (
        <div className={s.bFile}>
          <PaperClipOutlined />
          {isAbsoluteUrl(content) ? (
            <a href={content} target="_blank" rel="noopener noreferrer" download>
              {lang === "ru"
                ? "Скачать материал"
                : lang === "en"
                  ? "Download material"
                  : "Materialni yuklab olish"}
            </a>
          ) : (
            <span>{lang === "ru" ? "Файл" : lang === "en" ? "File" : "Fayl"}</span>
          )}
        </div>
      );
    case "HINT":
      return (
        <div className={s.bHint}>
          <BulbOutlined className={s.bHintIcon} />
          <div>{content}</div>
        </div>
      );
    default:
      return null;
  }
};

const MasterclassSinglePage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const [messageApi, contextHolder] = message.useMessage();

  const current = useSelector(
    (state: any) =>
      (state.masterclass?.current ?? null) as MasterclassDetail | null
  );
  const loading = useSelector(
    (state: any) => (state.masterclass?.currentLoading ?? false) as boolean
  );
  const error = useSelector(
    (state: any) => (state.masterclass?.currentError ?? "") as string
  );
  const list = useSelector(
    (state: any) => (state.masterclass?.list ?? []) as Masterclass[]
  );
  const lang = useSelector((state: any) => state.lang.lang);

  const pick = <T,>(uz: T, ru: T): T => (lang === "ru" ? ru : uz);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  useEffect(() => {
    if (id) dispatch(fetchMasterclassById(id));
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch sibling list once for the right sidebar
    if (list.length === 0) dispatch(fetchMasterclasses());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  const blocks = useMemo<MasterclassBlock[]>(() => {
    if (!current?.blocks) return [];
    return current.blocks
      .slice()
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [current]);

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
          subTitle={
            t(
              "Master-klass topilmadi",
              "Мастер-класс не найден",
              "Masterclass not found"
            )
          }
        />
      </Container>
    );
  }

  const title = pick(current.titleUz, current.titleRu);
  const heroImg = current.masterclassCategory?.imageUrl;
  const heroIsUrl = isAbsoluteUrl(heroImg);
  const categoryDesc = pick(
    current.masterclassCategory?.descriptionUz,
    current.masterclassCategory?.descriptionRu
  );

  return (
    <Container>
      <Helmet>
        <title>{`${title} — Masterclass`}</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/masterclass" className={s.back}>
          <ArrowLeftOutlined />
          <span>
            {t(
              "Masterclasslarga",
              "К мастер-классам",
              "Back to masterclasses"
            )}
          </span>
        </Link>

        {/* ─── Hero ─── */}
        <section
          className={s.hero}
          style={
            heroIsUrl
              ? { backgroundImage: `url("${heroImg}")` }
              : undefined
          }
        >
          <div className={s.heroOverlay} />
          <div className={s.heroBody}>
            <span className={s.heroKind}>
              {t("Masterclass", "Мастер-класс", "Masterclass")}
            </span>
            <h1 className={s.heroTitle}>{title}</h1>
          </div>
        </section>

        {/* ─── Content + sidebar ─── */}
        <div className={s.layout}>
          <main className={s.content}>
            <h2 className={s.coachName}>{title.toUpperCase()}</h2>
            {categoryDesc && (
              <div className={s.coachSub}>{categoryDesc}</div>
            )}

            <div className={s.blocks}>
              {blocks.length === 0 ? (
                <div className={s.empty}>
                  {t("Kontent yo‘q", "Нет содержимого", "No content")}
                </div>
              ) : (
                blocks.map((b) => <Block key={b.id} block={b} lang={lang} />)
              )}
            </div>
          </main>

          <aside className={s.sidebar}>
            <div className={s.sideTitle}>
              {t("Taniqli murabbiylar", "Известные тренеры", "Notable coaches")}
            </div>
            <ul className={s.sideList}>
              {list.slice(0, 12).map((m) => {
                const active = m.id === current.id;
                return (
                  <li key={m.id}>
                    <Link
                      to={`/masterclass/${m.id}`}
                      className={`${s.sideItem} ${active ? s.sideItemActive : ""}`}
                    >
                      <span className={s.sideName}>
                        {pick(m.titleUz, m.titleRu)}
                      </span>
                      <span className={s.sideKind}>
                        {t("Masterclass", "Мастер-класс", "Masterclass")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </Container>
  );
};

export default MasterclassSinglePage;
