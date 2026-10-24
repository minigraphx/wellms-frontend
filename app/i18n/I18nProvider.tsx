"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, INTL_LOCALE, TIME_ZONE, type Locale } from "./config";
import { messages } from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

export const useT = () => messages[useLocale()];

export function useFormat() {
  const locale = useLocale();
  return useMemo(() => formatters(locale), [locale]);
}

export function formatters(locale: Locale) {
  const tag = INTL_LOCALE[locale];
  return {
    date: (value: string | number | Date, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) =>
      new Intl.DateTimeFormat(tag, { timeZone: TIME_ZONE, ...options }).format(new Date(value)),
    number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(tag, options).format(value),
    currency: (amount: number, currency: string) => new Intl.NumberFormat(tag, { style: "currency", currency }).format(amount),
  };
}
