"use client";

import { EscolaLMSContextProvider } from "@escolalms/sdk/lib/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EscolaLMSContextProvider apiUrl={process.env.NEXT_PUBLIC_API_URL!}>
      {children}
    </EscolaLMSContextProvider>
  );
}
