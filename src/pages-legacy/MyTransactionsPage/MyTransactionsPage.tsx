"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  HistoryOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import ModernPagination from "../../components/ui/ModernPagination/ModernPagination";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import {
  fetchWalletTransactions,
  walletActions,
  formatAmount,
  type WalletTransaction,
  type WalletPagination,
} from "../../store/wallet/walletSlice";
import s from "./MyTransactionsPage.module.scss";

const MyTransactionsPage = () => {
  const dispatch = useDispatch<any>();
  const [, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;
  const list = useSelector(
    (state: any) => (state.wallet?.list ?? []) as WalletTransaction[]
  );
  const loading = useSelector(
    (state: any) => (state.wallet?.loading ?? false) as boolean
  );
  const pagination = useSelector(
    (state: any) =>
      (state.wallet?.pagination ?? {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      }) as WalletPagination
  );

  useEffect(() => {
    dispatch(
      fetchWalletTransactions({
        page: pagination.page,
        limit: pagination.limit,
      })
    );
  }, [dispatch, pagination.page, pagination.limit]);

  return (
    <Container>
      <Helmet>
        <title>Toʻlov tarixi — Coach Hub</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/user" className={s.back}>
          <ArrowLeftOutlined />
          <span>{t("Profilga qaytish", "К профилю", "Back to profile")}</span>
        </Link>

        <header className={s.header}>
          <h1 className={s.title}>
            {t("Toʻlov tarixi", "История платежей", "Payment history")}
          </h1>
          <span className={s.count}>{pagination.total}</span>
        </header>

        {loading && list.length === 0 ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : list.length === 0 ? (
          <NotFound
            subTitle={t(
              "Tranzaksiyalar yoʻq",
              "Транзакций нет",
              "No transactions"
            )}
          />
        ) : (
          <>
            <div className={s.list}>
              {list.map((tx) => {
                const created = moment(tx.createdAt).isValid()
                  ? moment(tx.createdAt).format("DD MMM YYYY, HH:mm")
                  : "";
                const isSuccess = tx.status === "SUCCESS";
                const isFailed = tx.status === "FAILED";
                const label = tx.subscriptionsPlansId
                  ? t("Obuna", "Подписка", "Subscription")
                  : t("Kitob", "Книга", "Book");
                return (
                  <div key={tx.id} className={s.item}>
                    <div
                      className={`${s.statusIcon} ${
                        isSuccess ? s.ok : isFailed ? s.fail : s.pending
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircleFilled />
                      ) : isFailed ? (
                        <CloseCircleFilled />
                      ) : (
                        <ClockCircleFilled />
                      )}
                    </div>
                    <div className={s.body}>
                      <div className={s.topRow}>
                        <span className={s.label}>{label}</span>
                        {tx.provider && (
                          <span className={s.provider}>
                            {tx.provider.toUpperCase()}
                          </span>
                        )}
                        {tx.externalId && (
                          <span className={s.txId}>#{tx.externalId}</span>
                        )}
                      </div>
                      <div className={s.date}>{created}</div>
                      {tx.errorMessage && (
                        <div className={s.error}>{tx.errorMessage}</div>
                      )}
                    </div>
                    <div
                      className={`${s.amount} ${
                        isFailed ? s.amountFail : ""
                      }`}
                    >
                      {isFailed
                        ? "—"
                        : `${formatAmount(tx.amount)} soʻm`}
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination.total > 0 && (
              <div className={s.paginationWrap}>
                <ModernPagination
                  page={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  onChange={(p) => dispatch(walletActions.setPage(p))}
                  onPageSizeChange={(size) =>
                    dispatch(walletActions.setLimit(size))
                  }
                  pageSizeOptions={[10, 20, 50]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
};

export default MyTransactionsPage;
