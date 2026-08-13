"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  CrownOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import { Helmet } from "@/lib/helmet-compat";
import { Link, useParams } from "@/lib/router-compat";
import {
  fetchPlanById,
  plansActions,
  calcFinalPrice,
  planHasDiscount,
  discountPercentValue,
  planTitle,
  planDescription,
  featureText,
  formatPrice,
  durationLabel,
  type SubscriptionPlan,
} from "../../store/plans/plansSlice";
import s from "./PlanSinglePage.module.scss";

const PlanSinglePage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [messageApi, contextHolder] = message.useMessage();

  const plan = useSelector(
    (state: any) => state.plans?.current as SubscriptionPlan | null
  );
  const loading = useSelector(
    (state: any) => (state.plans?.currentLoading ?? false) as boolean
  );
  const error = useSelector(
    (state: any) => (state.plans?.currentError ?? "") as string
  );
  const lang = useSelector(
    (state: any) => state.lang.lang
  ) as "uz" | "ru" | "en";
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  useEffect(() => {
    if (Number.isFinite(id)) dispatch(fetchPlanById(id));
    return () => {
      dispatch(plansActions.clearCurrent());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  if (loading && !plan) {
    return (
      <Container>
        <div className={s.loader}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  if (!plan) {
    return (
      <Container>
        <NotFound
          subTitle={t("Tarif topilmadi", "Тариф не найден", "Plan not found")}
        />
      </Container>
    );
  }

  const discounted = planHasDiscount(plan);
  const finalPrice = calcFinalPrice(plan);
  const percent = discountPercentValue(plan);
  const title = planTitle(plan, lang);
  const desc = planDescription(plan, lang);
  const dur = durationLabel(plan.durationDays, lang);

  // Prefer the structured `features` array. Fall back to splitting the
  // free-text description for older plans that haven't been migrated.
  const features =
    plan.features && plan.features.length > 0
      ? plan.features.map((f) => ({
          text: featureText(f, lang),
          highlight: !!f.highlight,
        }))
      : (desc || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((text) => ({ text, highlight: false }));

  return (
    <Container>
      <Helmet>
        <title>{title} — Coach Hub</title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <Link to="/plans" className={s.back}>
          <ArrowLeftOutlined />
          <span>
            {t("Barcha tariflar", "Все тарифы", "All plans")}
          </span>
        </Link>

        <div className={s.layout}>
          <article className={s.main}>
            <div className={s.titleRow}>
              <h1 className={s.title}>{title}</h1>
              {discounted && (
                <span className={s.discountBadge}>−{percent}%</span>
              )}
            </div>

            <div className={s.metaRow}>
              <span className={s.metaItem}>
                <ClockCircleOutlined />
                {dur}
              </span>
              <span className={s.metaItem}>
                <CalendarOutlined />
                {plan.durationDays}{" "}
                {t("kun", "дн.", "days")}
              </span>
            </div>

            {features.length > 0 ? (
              <div className={s.section}>
                <h2 className={s.sectionTitle}>
                  {t(
                    "Tarif tarkibi",
                    "Что входит в тариф",
                    "What's included"
                  )}
                </h2>
                <ul className={s.features}>
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className={`${s.featureItem} ${
                        f.highlight ? s.featureHighlight : ""
                      }`}
                    >
                      <CheckCircleFilled />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={s.empty}>
                {t(
                  "Tavsif kiritilmagan.",
                  "Описание не указано.",
                  "No description provided."
                )}
              </p>
            )}
          </article>

          <aside className={s.sidebar}>
            <div className={s.priceCard}>
              {discounted && (
                <span className={s.priceOld}>
                  {formatPrice(plan.basePrice)}{" "}
                  {t("soʻm", "сум", "UZS")}
                </span>
              )}
              <div className={s.priceNow}>
                <span className={s.priceValue}>
                  {formatPrice(finalPrice)}
                </span>
                <span className={s.priceCurrency}>
                  {t("soʻm", "сум", "UZS")}
                </span>
              </div>
              <span className={s.priceMeta}>
                / {dur}
              </span>

              <Link to="/me/subscriptions" className={s.subscribeBtn}>
                <CrownOutlined />
                {t("Obuna boʻlish", "Подписаться", "Subscribe")}
              </Link>

              <p className={s.priceNote}>
                {t(
                  "Obuna avtomatik yangilanadi. Istalgan vaqt bekor qilish mumkin.",
                  "Подписка автоматически продлевается. Отменить можно в любой момент.",
                  "Subscriptions renew automatically. Cancel anytime."
                )}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
};

export default PlanSinglePage;
