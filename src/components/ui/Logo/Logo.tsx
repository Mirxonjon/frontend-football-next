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
  >
    <img width={40} src={(img as any).src ?? img} alt="logo" />
    <span
      style={{
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.1,
        color: "#000",
        maxWidth: 90,
      }}
    >
      Murabbiylar markazi
    </span>
  </Link>
);
export default Logo;