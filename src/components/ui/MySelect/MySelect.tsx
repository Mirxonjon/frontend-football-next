"use client";

import { Select } from "antd";
import s from "./MySelect.module.scss";
import { useState } from "react";

const MySelect = ({ options, onSelect, defaultValue }: any) => {
  const [value, setValue] = useState(
    defaultValue ? defaultValue : options?.[0]?.value
  );

  return (
    <Select
      className={s.select}
      defaultValue={value}
      onChange={(selectedValue) => {
        setValue(selectedValue);
        onSelect(selectedValue);
      }}
      options={options.map((el) => ({
        value: el.value,
        label: el.name,
      }))}
    />
  );
};

export default MySelect;