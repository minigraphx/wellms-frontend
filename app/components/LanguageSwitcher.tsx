"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE } from "../i18n/config";
import { useLocale, useT } from "../i18n/I18nProvider";

const ONE_YEAR = 60 * 60 * 24 * 365;

// The choice lives in a cookie so server-rendered pages come out in the same language.
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();

  function choose(next: string) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.refresh();
  }

  return (
    <div role="group" aria-label={t.nav.switchLanguage} className="flex items-center gap-1 text-xs font-medium">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-pressed={code === locale}
          className={`uppercase px-1.5 py-0.5 rounded ${
            code === locale ? "text-[#04323e] bg-gray-100" : "text-gray-400 hover:text-[#1abc9c]"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
