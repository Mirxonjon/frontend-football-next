"use client";

import { Link } from "@/lib/router-compat";
import img from "./../../../assets/img/logoNew.png";

// eslint-disable-next-line react/prop-types
const Logo = (props) => (
  <Link
    to="/"
    {...props}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      textDecoration: "none",
      color: "inherit",
    }}
    aria-label="Coach Hub"
  >
    <img width={40} height={40} src={(img as any).src ?? img} alt="Coach Hub" />
    <span
      style={{
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.1,
        color: "#000",
        whiteSpace: "nowrap",
      }}
    >
      Coach Hub
    </span>
  </Link>
);
export default Logo;
