"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin, message } from "antd";
import {
  CrownOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";

import Container from "../../components/ui/Container/Container";
import NotFound from "../../components/ui/404/404";
import SubscribeModal from "../../components/ui/SubscribeModal/SubscribeModal";
import { Helmet } from "@/lib/helmet-compat";
import { Link } from "@/lib/router-compat";
import {
  fetchPlans,
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
import s from "./PlansPage.module.scss";

const PlansPage = () => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  const plans = useSelector(
    (state: any) => (state.plans?.list ?? []) as SubscriptionPlan[]
  );
  const loading = useSelector(
    (state: any) => (state.plans?.loading ?? false) as boolean
  );
  const error = useSelector(
    (state: any) => (state.plans?.error ?? "") as string
  );
  const lang = useSelector(
    (state: any) => state.lang.lang
  ) as "uz" | "ru" | "en";
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const [subscribePlan, setSubscribePlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  useEffect(() => {
    if (error) messageApi.error(error);
  }, [error, messageApi]);

  // Pick the longest-duration plan as "recommended" (typically the best value)
  const recommendedId = plans.reduce<number | null>((best, p) => {
    if (best === null) return p.id;
    const bestPlan = plans.find((x) => x.id === best);
    if (!bestPlan) return p.id;
    return p.durationDays > bestPlan.durationDays ? p.id : best;
  }, null);

  return (
    <Container>
      <Helmet>
        <title>
          {t(
            "Tariflar — Coach Hub",
            "Тарифы — Coach Hub",
            "Plans — Coach Hub"
          )}
        </title>
      </Helmet>

      {contextHolder}

      <div className={s.wrapper}>
        <header className={s.hero}>
          <div className={s.heroBadge}>
            <CrownOutlined />
            {t("Obuna", "Подписка", "Subscription")}
          </div>
          <h1 className={s.heroTitle}>
            {t(
              "Oʻzingizga mos tarifni tanlang",
              "Выберите подходящий тариф",
              "Choose a plan that fits you"
            )}
          </h1>
          <p className={s.heroSubtitle}>
            {t(
              "Barcha mashgʻulotlar, masterclasslar va materiallar — cheklovsiz.",
              "Все тренировки, мастер-классы и материалы платформы — без ограничений.",
              "All trainings, masterclasses and platform materials — no limits."
            )}
          </p>
        </header>

        {loading && plans.length === 0 ? (
          <div className={s.loader}>
            <Spin size="large" />
          </div>
        ) : plans.length === 0 ? (
          <NotFound
            subTitle={t("Tariflar topilmadi", "Тарифы не найдены", "No plans found")}
          />
        ) : (
          <div className={s.grid}>
            {plans.map((p) => {
              const isRecommended = p.id === recommendedId && plans.length > 1;
              const discounted = planHasDiscount(p);
              const finalPrice = calcFinalPrice(p);
              const percent = discountPercentValue(p);
              const title = planTitle(p, lang);
              const desc = planDescription(p, lang);
              const dur = durationLabel(p.durationDays, lang);

              return (
                <div
                  key={p.id}
                  className={`${s.card} ${
                    isRecommended ? s.cardRecommended : ""
                  }`}
                >
                  {isRecommended && (
                    <div className={s.ribbon}>
                      <ThunderboltFilled />
                      {t("Eng foydali", "Лучший выбор", "Best value")}
                    </div>
                  )}
                  {discounted && (
                    <div className={s.discountBadge}>
                      −{percent}%
                    </div>
                  )}

                  <div className={s.cardHead}>
                    <h3 className={s.cardTitle}>{title}</h3>
                    <span className={s.duration}>
                      <ClockCircleOutlined />
                      {dur}
                    </span>
                  </div>

                  <div className={s.priceBlock}>
                    {discounted && (
                      <span className={s.priceOld}>
                        {formatPrice(p.basePrice)} {t("soʻm", "сум", "UZS")}
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
                  </div>

                  {p.features && p.features.length > 0 ? (
                    <ul className={s.featureList}>
                      {p.features.map((f, i) => (
                        <li
                          key={i}
                          className={`${s.featureItem} ${
                            f.highlight ? s.featureHighlight : ""
                          }`}
                        >
                          <CheckCircleFilled />
                          <span>{featureText(f, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : desc ? (
                    <ul className={s.featureList}>
                      {desc
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i} className={s.featureItem}>
                            <CheckCircleFilled />
                            <span>{line}</span>
                          </li>
                        ))}
                    </ul>
                  ) : null}

                  <Link to={`/plans/${p.id}`} className={s.detailsLink}>
                    {t("Batafsil", "Подробнее", "Details")}
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSubscribePlan(p)}
                    className={`${s.subscribeBtn} ${
                      isRecommended ? s.subscribeBtnPrimary : ""
                    }`}
                  >
                    <CrownOutlined />
                    {t("Obuna boʻlish", "Подписаться", "Subscribe")}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <footer className={s.note}>
          {t(
            "Obuna avtomatik yangilanadi. Istalgan vaqt shaxsiy kabinetda bekor qilishingiz mumkin.",
            "Подписка автоматически продлевается. Отменить можно в любой момент в личном кабинете.",
            "Subscriptions renew automatically. You can cancel anytime in your account."
          )}
        </footer>
      </div>

      <SubscribeModal
        open={subscribePlan !== null}
        plan={subscribePlan}
        onClose={() => setSubscribePlan(null)}
      />
    </Container>
  );
};

export default PlansPage;
