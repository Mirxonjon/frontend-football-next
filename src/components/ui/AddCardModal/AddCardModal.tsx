"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Input, Button, message } from "antd";
import {
  CreditCardOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  initCard,
  verifyCard,
  fetchCards,
  type InitCardResponse,
} from "../../../store/cards/cardsSlice";
import s from "./AddCardModal.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
};

const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatExpire = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
};

const AddCardModal = ({ open, onClose }: Props) => {
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();
  const lang = useSelector((state: any) => state.lang.lang);
  const tt = (uz: string, ru: string, en: string): string =>
    lang === "ru" ? ru : lang === "en" ? en : uz;

  const [step, setStep] = useState<"card" | "otp">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expire, setExpire] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState<InitCardResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("card");
      setCardNumber("");
      setExpire("");
      setOtp("");
      setPending(null);
      setSubmitting(false);
      setSecondsLeft(0);
    }
  }, [open]);

  // OTP countdown
  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  const submitCard = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    const expDigits = expire.replace(/\D/g, "");
    if (digits.length < 16) {
      messageApi.error(
        tt("16 raqam kiriting", "Введите 16 цифр", "Enter 16 digits")
      );
      return;
    }
    if (expDigits.length !== 4) {
      messageApi.error(
        tt("Muddat: OO/YY", "Срок: ММ/ГГ", "Expires: MM/YY")
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        initCard({ cardNumber: digits, expireDate: expDigits })
      ).unwrap();
      setPending(res);
      setSecondsLeft(res.expiresInSeconds || 120);
      setStep("otp");
    } catch (err: any) {
      messageApi.error(err || tt("Xatolik", "Ошибка", "Error"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async () => {
    if (!pending) return;
    const code = otp.replace(/\D/g, "");
    if (code.length < 4) {
      messageApi.error(
        tt("Kodni kiriting", "Введите код", "Enter the code")
      );
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        verifyCard({ cardId: pending.cardId, smsCode: code })
      ).unwrap();
      messageApi.success(
        tt("Karta saqlandi", "Карта сохранена", "Card saved")
      );
      dispatch(fetchCards());
      onClose();
    } catch (err: any) {
      messageApi.error(err || tt("Xatolik", "Ошибка", "Error"));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = () => {
    setStep("card");
    setOtp("");
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
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
          {step === "card" ? <CreditCardOutlined /> : <SafetyOutlined />}
        </div>

        <h2 className={s.title}>
          {step === "card"
            ? tt("Karta qo‘shish", "Добавить карту", "Add card")
            : tt("Tasdiqlash", "Подтверждение", "Confirm")}
        </h2>
        <p className={s.subtitle}>
          {step === "card"
            ? tt(
                "Bank kartasi ma'lumotlarini kiriting",
                "Введите данные банковской карты",
                "Enter your bank card details"
              )
            : pending?.phoneNumber
              ? tt(
                  `SMS kod ${pending.phoneNumber} raqamiga yuborildi`,
                  `СМС код отправлен на ${pending.phoneNumber}`,
                  `SMS code sent to ${pending.phoneNumber}`
                )
              : tt(
                  "SMS dan kelgan kodni kiriting",
                  "Введите код из СМС",
                  "Enter the SMS code"
                )}
        </p>

        {step === "card" ? (
          <div className={s.form}>
            <label className={s.label}>
              {tt("Karta raqami", "Номер карты", "Card number")}
            </label>
            <Input
              className={s.input}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={23}
              inputMode="numeric"
            />

            <label className={s.label}>
              {tt("Amal qilish muddati", "Срок действия", "Expiration")}
            </label>
            <Input
              className={s.input}
              placeholder="MM/YY"
              value={expire}
              onChange={(e) => setExpire(formatExpire(e.target.value))}
              maxLength={5}
              inputMode="numeric"
            />

            <Button
              type="primary"
              className={s.submit}
              onClick={submitCard}
              loading={submitting}
              block
            >
              {tt("Kod olish", "Получить код", "Get code")}
            </Button>
          </div>
        ) : (
          <div className={s.form}>
            {pending?.cardNumberMasked && (
              <div className={s.maskedPan}>{pending.cardNumberMasked}</div>
            )}

            <label className={s.label}>
              {tt("SMS kodi", "Код из СМС", "SMS code")}
            </label>
            <Input
              className={`${s.input} ${s.otpInput}`}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />

            <div className={s.timerRow}>
              {secondsLeft > 0 ? (
                <span className={s.timer}>
                  <LoadingOutlined />{" "}
                  {String(mm).padStart(1, "0")}:
                  {String(ss).padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  className={s.resendBtn}
                  onClick={resend}
                >
                  {tt("Qayta yuborish", "Отправить заново", "Resend")}
                </button>
              )}
            </div>

            <Button
              type="primary"
              className={s.submit}
              onClick={submitOtp}
              loading={submitting}
              block
            >
              {tt("Tasdiqlash", "Подтвердить", "Confirm")}
            </Button>

            <button
              type="button"
              className={s.backBtn}
              onClick={() => setStep("card")}
            >
              <ArrowLeftOutlined />
              {tt("Orqaga", "Назад", "Back")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddCardModal;
