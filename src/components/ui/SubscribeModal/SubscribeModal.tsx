"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button, Switch, message } from "antd";
import {
  CreditCardOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CrownOutlined,
} from "@ant-design/icons";

import { fetchCards, type Card } from "../../../store/cards/cardsSlice";
import { createSubscription } from "../../../store/subscriptions/subscriptionsSlice";
import {
  calcFinalPrice,
  planHasDiscount,
  planTitle,
  formatPrice,
  durationLabel,
  type SubscriptionPlan,
} from "../../../store/plans/plansSlice";
import AddCardModal from "../AddCardModal/AddCardModal";
// Kitob modali bilan bir xil ko'rinish — uslublar takrorlanmasin.
import s from "../PurchaseModal/PurchaseModal.module.scss";

type Props = {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const SubscribeModal = ({ open, plan, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang) as
    | "uz"
    | "ru"
    | "en";
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const cards = useSelector((state: any) => (state.cards?.list ?? []) as Card[]);
  const cardsLoading = useSelector(
    (state: any) => (state.cards?.loading ?? false) as boolean
  );

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [autoPay, setAutoPay] = useState(true);
  const [paying, setPaying] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchCards());
      setSelectedCardId(null);
      setAutoPay(true);
      setPaying(false);
    }
  }, [open, dispatch]);

  const verifiedCards = useMemo(
    () => cards.filter((c) => c.isVerified && c.isActive),
    [cards]
  );

  useEffect(() => {
    if (verifiedCards.length === 1 && selectedCardId == null) {
      setSelectedCardId(verifiedCards[0].id);
    }
  }, [verifiedCards, selectedCardId]);

  if (!plan) return null;

  const finalPrice = calcFinalPrice(plan);
  const discounted = planHasDiscount(plan);
  const isFree = finalPrice <= 0;
  const title = planTitle(plan, lang);
  const dur = durationLabel(plan.durationDays, lang);

  const handlePay = async () => {
    if (!isFree && verifiedCards.length === 0) {
      setAddCardOpen(true);
      return;
    }
    if (!isFree && verifiedCards.length > 1 && selectedCardId == null) {
      messageApi.warning(t("Karta tanlang", "Выберите карту", "Select a card"));
      return;
    }

    setPaying(true);
    try {
      const result = await dispatch(
        createSubscription({
          planId: plan.id,
          cardId: selectedCardId ?? undefined,
          // Backend avtomatik uzaytirish uchun kartani talab qiladi.
          autoPay: selectedCardId != null ? autoPay : false,
        })
      ).unwrap();
      const amount = result?.transaction?.amount ?? finalPrice;
      messageApi.success(
        t(
          `Obuna faollashtirildi: ${formatPrice(amount)} soʻm`,
          `Подписка активирована: ${formatPrice(amount)} сум`,
          `Subscription activated: ${formatPrice(amount)} UZS`
        )
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const code = err?.code;
      const msg = err?.message;
      if (code === 402) {
        const detail = err?.raw?.error?.errorMessage;
        messageApi.error(
          t(
            "Toʻlov amalga oshmadi: ",
            "Платёж не прошёл: ",
            "Payment failed: "
          ) + (detail || msg)
        );
      } else if (code === 409) {
        messageApi.warning(
          t(
            "Sizda allaqachon faol obuna bor",
            "У вас уже есть активная подписка",
            "You already have an active subscription"
          )
        );
        onSuccess?.();
        onClose();
      } else if (code === 400 && /card/i.test(msg || "")) {
        // Backend: pullik tarifga karta majburiy. UI bu holatga yo'l
        // qo'ymasligi kerak, lekin poyga bo'lsa — inglizcha xato o'rniga
        // karta qo'shish oynasini ochamiz.
        setAddCardOpen(true);
      } else {
        messageApi.error(msg || "Xatolik");
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={460}
        destroyOnClose
        className={s.modal}
        title={null}
      >
        {contextHolder}

        <div className={s.body}>
          <div className={s.iconBadge}>
            <CrownOutlined />
          </div>

          <h2 className={s.title}>{title}</h2>

          <div className={s.priceBlock}>
            {discounted && (
              <span className={s.priceOld}>{formatPrice(plan.basePrice)}</span>
            )}
            <span
              className={`${s.priceNow} ${discounted ? s.priceNowDiscount : ""}`}
            >
              {isFree
                ? t("Bepul", "Бесплатно", "Free")
                : `${formatPrice(finalPrice)} ${t("soʻm", "сум", "UZS")}`}
            </span>
            <span className={s.priceMeta}> / {dur}</span>
          </div>

          {!isFree && (
            <div className={s.cardsSection}>
              <div className={s.sectionLabel}>
                {t("Toʻlov usuli", "Способ оплаты", "Payment method")}
              </div>

              {cardsLoading && verifiedCards.length === 0 ? (
                <div className={s.loadingCards}>
                  {t("Yuklanmoqda...", "Загрузка...", "Loading…")}
                </div>
              ) : verifiedCards.length === 0 ? (
                <div className={s.noCards}>
                  <CreditCardOutlined className={s.noCardsIcon} />
                  <div className={s.noCardsText}>
                    {t(
                      "Saqlangan kartalar yoʻq",
                      "Нет сохранённых карт",
                      "No saved cards"
                    )}
                  </div>
                </div>
              ) : (
                <div className={s.cardOptions}>
                  {verifiedCards.map((c) => {
                    const active = c.id === selectedCardId;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className={`${s.cardOption} ${
                          active ? s.cardOptionActive : ""
                        }`}
                        onClick={() => setSelectedCardId(c.id)}
                      >
                        <span className={s.cardOptionIcon}>
                          <CreditCardOutlined />
                        </span>
                        <span className={s.cardOptionBody}>
                          <span className={s.cardOptionNumber}>
                            •••• {c.last4}
                          </span>
                          {c.phoneNumber && (
                            <span className={s.cardOptionPhone}>
                              {c.phoneNumber}
                            </span>
                          )}
                        </span>
                        {active && (
                          <CheckCircleFilled className={s.cardOptionCheck} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className={s.addCardLink}
                onClick={() => setAddCardOpen(true)}
              >
                <PlusOutlined />
                {t("Yangi karta qoʻshish", "Новая карта", "Add new card")}
              </button>

              {selectedCardId != null && (
                <label className={s.autoPayRow}>
                  <Switch
                    size="small"
                    checked={autoPay}
                    onChange={setAutoPay}
                  />
                  <span className={s.autoPayText}>
                    {t(
                      "Obunani avtomatik uzaytirish",
                      "Автоматически продлевать подписку",
                      "Renew subscription automatically"
                    )}
                  </span>
                </label>
              )}
            </div>
          )}

          <Button
            type="primary"
            className={s.payBtn}
            onClick={handlePay}
            loading={paying}
            // Kartalar hali yuklanmagan bo'lsa bosishga yo'l qo'ymaymiz —
            // aks holda bo'sh ro'yxat "karta yo'q" deb noto'g'ri tushuniladi.
            disabled={!isFree && cardsLoading && verifiedCards.length === 0}
            block
          >
            {isFree
              ? t("Faollashtirish", "Активировать", "Activate")
              : t(
                  `${formatPrice(finalPrice)} soʻm toʻlash`,
                  `Оплатить ${formatPrice(finalPrice)} сум`,
                  `Pay ${formatPrice(finalPrice)} UZS`
                )}
          </Button>
        </div>
      </Modal>

      <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} />
    </>
  );
};

export default SubscribeModal;
