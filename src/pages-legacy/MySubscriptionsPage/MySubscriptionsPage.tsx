"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Spin, Switch, message } from "antd";
import {
  ArrowLeftOutlined,
  CrownFilled,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import {
  fetchMySubscriptions,
  setAutoPay,
  computePlanPrice,
  type Subscription,
} from "../../store/subscriptions/subscriptionsSlice";
import { formatAmount } from "../../store/wallet/walletSlice";
import s from "./MySubscriptionsPage.module.scss";

const MySubscriptionsPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const active = useSelector(
    (state: any) => (state.subscriptions?.active ?? []) as Subscription[]
  );
  const history = useSelector(
    (state: any) => (state.subscriptions?.history ?? []) as Subscription[]
  );
  const loading = useSelector(
    (state: any) => (state.subscriptions?.loading ?? false) as boolean
  );
  const mutating = useSelector(
    (state: any) => (state.subscriptions?.mutating ?? false) as boolean
  );

  useEffect(() => {
    dispatch(fetchMySubscriptions());
  }, [dispatch]);

  const handleAutoPay = async (
    enabled: boolean,
    cardId?: number | null
  ) => {
    try {
      await dispatch(
        setAutoPay({ enabled, cardId: cardId ?? undefined })
      ).unwrap();
      messageApi.success(
        enabled
          ? t("Avto-toʻlov yoqildi", "Автооплата включена", "Auto-pay enabled")
          : t(
              "Avto-toʻlov oʻchirildi",
              "Автооплата отключена",
              "Auto-pay disabled"
            )
      );
    } catch (err: any) {
      messageApi.error(err || "Xatolik");
    }
  };

  const renderSub = (sub: Subscription, isActive: boolean) => {
    const planTitle =
      lang === "ru"
        ? sub.subscriptionsPlan?.titleRu
        : sub.subscriptionsPlan?.titleUz;
    const start = moment(sub.startDate);
    const end = moment(sub.endDate);
    const daysLeft = end.isValid() ? end.diff(moment(), "days") : 0;
    const price = sub.subscriptionsPlan
      ? computePlanPrice(sub.subscriptionsPlan)
      : 0;

    return (
      <div
        key={sub.id}
        className={`${s.item} ${isActive ? s.itemActive : s.itemHistory}`}
      >
        <div className={s.badge}>
          <CrownFilled />
        </div>
        <div className={s.body}>
          <div className={s.planName}>{planTitle || "—"}</div>
          <div className={s.meta}>
            <span>
              {start.format("DD MMM YYYY")} — {end.format("DD MMM YYYY")}
            </span>
            {isActive && daysLeft >= 0 && (
              <>
                <span className={s.dot} />
                <span
                  className={daysLeft <= 3 ? s.daysWarn : s.days}
                >
                  {daysLeft > 0
                    ? t(
                        `${daysLeft} kun qoldi`,
                        `Осталось ${daysLeft} дн.`,
                        `${daysLeft} day(s) left`
                      )
                    : t(
                        "Bugun tugaydi",
                        "Истекает сегодня",
                        "Expires today"
                      )}
                </span>
              </>
            )}
            {!isActive && (
              <>
                <span className={s.dot} />
                <span className={s.statusEnded}>
                  {t("Tugagan", "Завершено", "Ended")}
                </span>
              </>
            )}
          </div>
          <div className={s.price}>
            {formatAmount(price)} soʻm /{" "}
            {sub.subscriptionsPlan?.durationDays}{" "}
            {t("kun", "дн.", "days")}
          </div>
        </div>
        {isActive && (
          <div className={s.autoPayWrap}>
            <span className={s.autoPayLabel}>
              <ReloadOutlined />
              {t("Avto-toʻlov", "Авто-оплата", "Auto-pay")}
            </span>
            <Switch
              checked={sub.autoPay}
              loading={mutating}
              onChange={(checked) => handleAutoPay(checked, sub.cardId)}
            />
          </div>
        )}
      </div>
    );
  };

  const totalCount = active.length + history.length;

  return (
    <Container>
      <Helmet>
        <title>Mening obunalarim — Coach Hub</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/user" className={s.back}>
          <ArrowLeftOutlined />
          <span>{t("Profilga qaytish", "К профилю", "Back to profile")}</span>
        </Link>

        <header className={s.header}>
          <h1 className={s.title}>
            {t("Mening obunalarim", "Мои подписки", "My subscriptions")}
          </h1>
          <span className={s.count}>{totalCount}</span>
        </header>

        {loading && totalCount === 0 ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : totalCount === 0 ? (
          <NotFound
            subTitle={t("Obunalar yoʻq", "Подписок нет", "No subscriptions")}
          />
        ) : (
          <>
            {active.length > 0 && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  <CrownFilled />
                  {t("Faol", "Активные", "Active")}
                  <span className={s.sectionCount}>{active.length}</span>
                </h2>
                <div className={s.list}>
                  {active.map((sub) => renderSub(sub, true))}
                </div>
              </section>
            )}

            {history.length > 0 && (
              <section className={s.section}>
                <h2 className={s.sectionTitle}>
                  <HistoryOutlined />
                  {t("Tarix", "История", "History")}
                  <span className={s.sectionCount}>{history.length}</span>
                </h2>
                <div className={s.list}>
                  {history.map((sub) => renderSub(sub, false))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Container>
  );
};

export default MySubscriptionsPage;
