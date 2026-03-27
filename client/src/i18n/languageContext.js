import { createContext } from "react";
import { fallbackLocale, translations } from "./translations.js";

export const LanguageContext = createContext(null);

function applyVars(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function translate(locale, key, vars) {
  const pack = translations[locale] || translations[fallbackLocale];
  const fallback = translations[fallbackLocale];
  const raw = pack[key] ?? fallback[key] ?? key;
  return applyVars(raw, vars);
}
