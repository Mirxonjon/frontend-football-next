"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button, message } from "antd";
import {
  CreditCardOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import {
  fetchCards,
  type Card,
} from "../../../store/cards/cardsSlice";
import {
  purchaseBook,
  computeDisplayPrice,
  hasDiscount,
  formatPrice,
  type Book,
} from "../../../store/books/booksSlice";
import AddCardModal from "../AddCardModal/AddCardModal";
import s from "./PurchaseModal.module.scss";

type Props = {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const PurchaseModal = ({ open, book, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang);
  const t = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const cards = useSelector(
    (state: any) => (state.cards?.list ?? []) as Card[]
  );
  const cardsLoading = useSelector(
    (state: any) => (state.cards?.loading ?? false) as boolean
  );

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchCards());
      setSelectedCardId(null);
      setPaying(false);
    }
  }, [open, dispatch]);

  const verifiedCards = useMemo(
    () => cards.filter((c) => c.isVerified && c.isActive),
    [cards]
  );

  // Auto-select if only 1 verified card
  useEffect(() => {
    if (verifiedCards.length === 1 && selectedCardId == null) {
      setSelectedCardId(verifiedCards[0].id);
    }
  }, [verifiedCards, selectedCardId]);

  if (!book) return null;

  const finalPrice = computeDisplayPrice(book);
  const discounted = hasDiscount(book);
  const isFree = finalPrice <= 0;
  const title = lang === "ru" ? book.titleRu : book.titleUz;

  const handlePay = async () => {
    if (!isFree && verifiedCards.length === 0) {
      setAddCardOpen(true);
      return;
    }
    if (
      !isFree &&
      verifiedCards.length > 1 &&
      selectedCardId == null
    ) {
      messageApi.warning(t("Karta tanlang", "Выберите карту", "Select a card"));
      return;
    }

    setPaying(true);
    try {
      const result = await dispatch(
        purchaseBook({
          bookId: book.id,
          cardId: selectedCardId ?? undefined,
        })
      ).unwrap();
      const amount =
        result?.transaction?.amount ?? finalPrice;
      messageApi.success(
        t(
          `Sotib olindi: ${formatPrice(amount, lang)}`,
          `Куплено за ${formatPrice(amount, lang)}`,
          `Purchased for ${formatPrice(amount, lang)}`
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
            "Bu kitob allaqachon sotib olingan",
            "Эта книга уже куплена",
            "This book is already purchased"
          )
        );
        onSuccess?.();
        onClose();
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
            <ShoppingCartOutlined />
          </div>

          <h2 className={s.title}>{title}</h2>

          <div className={s.priceBlock}>
            {discounted && (
              <span className={s.priceOld}>
                {formatPrice(book.basePrice, lang)}
              </span>
            )}
            <span
              className={`${s.priceNow} ${discounted ? s.priceNowDiscount : ""}`}
            >
              {isFree
                ? t("Bepul", "Бесплатно", "Free")
                : formatPrice(finalPrice, lang)}
            </span>
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
                        className={`${s.cardOption} ${active ? s.cardOptionActive : ""}`}
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
            </div>
          )}

          <Button
            type="primary"
            className={s.payBtn}
            onClick={handlePay}
            loading={paying}
            block
          >
            {isFree
              ? t("Bepul olish", "Получить бесплатно", "Get for free")
              : t(
                  `${formatPrice(finalPrice, lang)} toʻlash`,
                  `Оплатить ${formatPrice(finalPrice, lang)}`,
                  `Pay ${formatPrice(finalPrice, lang)}`
                )}
          </Button>
        </div>
      </Modal>

      <AddCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
      />
    </>
  );
};

export default PurchaseModal;
