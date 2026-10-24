"use client";

import { EscolaLMSContextProvider } from "@escolalms/sdk/lib/react";
import { ToastProvider } from "./components/Toast";
import { I18nProvider } from "./i18n/I18nProvider";
import type { Locale } from "./i18n/config";

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider locale={locale}>
      <EscolaLMSContextProvider apiUrl={process.env.NEXT_PUBLIC_API_URL!}>
        <ToastProvider>{children}</ToastProvider>
      </EscolaLMSContextProvider>
    </I18nProvider>
  );
}
