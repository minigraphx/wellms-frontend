"use client";

import { EscolaLMSContextProvider } from "@escolalms/sdk/lib/react";
import { ToastProvider } from "./components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EscolaLMSContextProvider apiUrl={process.env.NEXT_PUBLIC_API_URL!}>
      <ToastProvider>{children}</ToastProvider>
    </EscolaLMSContextProvider>
  );
}
