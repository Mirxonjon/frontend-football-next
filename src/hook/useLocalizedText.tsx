"use client";

import { useAppSelector } from "@/store/config-store";

export const useLocalizedText = () => {
  const lang = useAppSelector((state: any) => state.lang.lang);

  const localizeText = (text: string): string => {
    if (lang === "uz") {
      return text;
    } else if (lang === "ru") {
      return text + "_ru";
    }
    return text;
  };

  return localizeText;
};
