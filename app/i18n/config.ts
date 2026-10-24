export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";
export const LOCALE_COOKIE = "lang";

// Swiss audience: dates as 24.10.2026, numbers as 1’234.5. One time zone on server and
// client, so server-rendered dates match after hydration.
export const INTL_LOCALE: Record<Locale, string> = { de: "de-CH", en: "en-GB" };
export const TIME_ZONE = "Europe/Zurich";

export function resolveLocale(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}
