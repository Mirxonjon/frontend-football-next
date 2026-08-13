"use client";

import { LockOutlined, CrownFilled } from "@ant-design/icons";
import { Link } from "@/lib/router-compat";
import s from "./PaywallOverlay.module.scss";

type Props = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  hasFreePreview?: boolean;
  variant?: "block" | "fullscreen";
  className?: string;
};

const PaywallOverlay = ({
  title = "Bu kontentni ochish uchun obuna oling",
  description = "Pro obuna bilan barcha masterklasslar va darslarga toʻliq kirish.",
  ctaLabel = "Obunalar boʻlimiga oʻtish",
  ctaHref = "/subscriptions",
  hasFreePreview,
  variant = "block",
  className,
}: Props) => {
  return (
    <div
      className={`${s.root} ${variant === "fullscreen" ? s.fullscreen : ""} ${className ?? ""}`}
    >
      <div className={s.card}>
        <div className={s.iconBadge}>
          <LockOutlined />
        </div>
        <h3 className={s.title}>{title}</h3>
        <p className={s.desc}>{description}</p>
        <Link to={ctaHref} className={s.cta}>
          <CrownFilled />
          <span>{ctaLabel}</span>
        </Link>
        {hasFreePreview && (
          <div className={s.previewNote}>
            <span className={s.previewBadge}>BEPUL NAMOYISH</span>
            Bu kategoriyada bepul namoyish video mavjud
          </div>
        )}
      </div>
    </div>
  );
};

export default PaywallOverlay;
