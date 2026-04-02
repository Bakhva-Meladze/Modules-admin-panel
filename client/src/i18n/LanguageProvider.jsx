import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fallbackLocale } from "./translations.js";
import { LanguageContext, translate } from "./languageContext.js";

const STORAGE_KEY = "admin_locale";

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "en" || s === "ka") return s;
    } catch {}
    return fallbackLocale;
  });

  const setLocale = useCallback((loc) => {
    if (loc !== "en" && loc !== "ka") return;
    setLocaleState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "ka" ? "ka" : "en";
    document.title = translate(locale, "app.title");
  }, [locale]);

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
