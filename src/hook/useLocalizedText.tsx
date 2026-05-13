"use client";

import { useAppSelector } from "@/store/config-store";

export const useLocalizedText = () => {
  const lang = useAppSelector((state: any) => state.lang.lang);

  const localizeText = (text: string): string => {
    if (lang === "ru") return text + "_ru";
    if (lang === "en") return text + "_en";
    return text;
  };

  return localizeText;
};
