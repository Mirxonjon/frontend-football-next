"use client";

import c from "./MyButton.module.scss";
const MyButton = ({ children ,...props}: any) => {
  return <button  className={c.btn} {...props}>{children}</button>;
};

export default MyButton;