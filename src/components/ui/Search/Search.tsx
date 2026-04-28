"use client";

import { Input } from "antd";
import s from "./Search.module.scss";
import { useLocalizedText } from "../../../hook/useLocalizedText";

const Search = ({ ...props }: any) => {
  const changaLang = useLocalizedText();

  const content = {
    search: "Izlash",
    search_ru: "Найти",
  };
  return (
    <Input
      size="large"
      className={s.input}
      placeholder={content[changaLang("search")]}
      {...props}
      prefix={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M15.0252 13.8474L18.5941 17.4163L17.4156 18.5948L13.8467 15.0259C12.5634 16.0526 10.936 16.6667 9.16602 16.6667C5.02602 16.6667 1.66602 13.3067 1.66602 9.16675C1.66602 5.02675 5.02602 1.66675 9.16602 1.66675C13.306 1.66675 16.666 5.02675 16.666 9.16675C16.666 10.9367 16.0518 12.5642 15.0252 13.8474ZM13.3533 13.2291C14.3723 12.1789 14.9993 10.7464 14.9993 9.16675C14.9993 5.94383 12.3889 3.33341 9.16602 3.33341C5.9431 3.33341 3.33268 5.94383 3.33268 9.16675C3.33268 12.3897 5.9431 15.0001 9.16602 15.0001C10.7457 15.0001 12.1782 14.373 13.2283 13.354L13.3533 13.2291Z"
            fill="#181818"
          />
        </svg>
      }
    />
  );
};

export default Search;