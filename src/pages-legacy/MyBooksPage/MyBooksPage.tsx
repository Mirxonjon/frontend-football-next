"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  DownloadOutlined,
  MessageOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import ModernPagination from "../../components/ui/ModernPagination/ModernPagination";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import {
  fetchMyBooks,
  fetchDownloadUrl,
  type UserBook,
} from "../../store/books/booksSlice";
import s from "./MyBooksPage.module.scss";

const MyBooksPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;
  const myBooks = useSelector(
    (state: any) => (state.books?.myBooks ?? []) as UserBook[]
  );
  const loading = useSelector(
    (state: any) => (state.books?.myBooksLoading ?? false) as boolean
  );

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    dispatch(fetchMyBooks());
  }, [dispatch]);

  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return myBooks.slice(start, start + pageSize);
  }, [myBooks, page, pageSize]);

  const handleDownload = async (bookId: number) => {
    setDownloadingId(bookId);
    try {
      const res = await dispatch(fetchDownloadUrl(bookId)).unwrap();
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      messageApi.error(err || "Xatolik");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Container>
      <Helmet>
        <title>Mening kitoblarim — CoachingZona</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/user" className={s.back}>
          <ArrowLeftOutlined />
          <span>{t("Profilga qaytish", "К профилю", "Back to profile")}</span>
        </Link>

        <header className={s.header}>
          <h1 className={s.title}>
            {t("Mening kitoblarim", "Мои книги", "My books")}
          </h1>
          <span className={s.count}>{myBooks.length}</span>
        </header>

        {loading && myBooks.length === 0 ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : myBooks.length === 0 ? (
          <NotFound
            subTitle={t(
              "Kitoblar sotib olinmagan",
              "Книги не куплены",
              "No purchased books"
            )}
          />
        ) : (
          <>
          <div className={s.grid}>
            {paginatedBooks.map((ub) => {
              const title =
                lang === "ru" ? ub.book?.titleRu : ub.book?.titleUz;
              const cover = ub.book?.coverImageUrl;
              const isUrl =
                typeof cover === "string" &&
                (cover.startsWith("http://") || cover.startsWith("https://"));
              const acquired = moment(ub.acquiredAt).isValid()
                ? moment(ub.acquiredAt).format("DD MMM YYYY")
                : "";
              return (
                <div key={ub.id} className={s.card}>
                  <Link
                    to={`/books/${ub.bookId}`}
                    className={s.cover}
                    style={
                      isUrl ? { backgroundImage: `url("${cover}")` } : undefined
                    }
                  >
                    {!isUrl && <BookOutlined />}
                  </Link>
                  <div className={s.body}>
                    <Link
                      to={`/books/${ub.bookId}`}
                      className={s.cardTitle}
                    >
                      {title || "—"}
                    </Link>
                    <div className={s.meta}>
                      {acquired && (
                        <span>
                          {t("Sotib olingan: ", "Куплено: ", "Purchased: ")}
                          <strong>{acquired}</strong>
                        </span>
                      )}
                      {ub.transactionId == null && (
                        <span className={s.freeBadge}>
                          {t("Bepul", "Бесплатно", "Free")}
                        </span>
                      )}
                    </div>
                    <div className={s.cardActions}>
                      <Link
                        to={`/me/books/${ub.bookId}/ai-chat`}
                        className={s.aiChat}
                      >
                        <MessageOutlined />
                        {t("AI chat", "AI чат", "AI chat")}
                      </Link>
                      <button
                        type="button"
                        className={s.download}
                        disabled={downloadingId === ub.bookId}
                        onClick={() => handleDownload(ub.bookId)}
                      >
                        <DownloadOutlined />
                        {downloadingId === ub.bookId
                          ? "..."
                          : t("Yuklab olish", "Скачать", "Download")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {myBooks.length > 0 && (
            <div className={s.paginationWrap}>
              <ModernPagination
                page={page}
                pageSize={pageSize}
                total={myBooks.length}
                onChange={(p) => setPage(p)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                pageSizeOptions={[8, 12, 24, 48]}
              />
            </div>
          )}
          </>
        )}
      </div>
    </Container>
  );
};

export default MyBooksPage;
