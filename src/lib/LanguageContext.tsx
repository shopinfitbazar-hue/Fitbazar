"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Language, t as translate } from "@/lib/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

const LANGUAGE_COOKIE_NAME = "fitbazar_lang";

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  useEffect(() => {
    const stored = localStorage.getItem("fitbazar_lang") as Language | null;
    if ((stored === "en" || stored === "ne") && stored !== lang) {
      setLangState(stored);
    }
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("fitbazar_lang", newLang);
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const translateWithParams = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(key, lang, params),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translateWithParams }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
