"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL ?? "";

export default function MessagesPage() {
  const { user } = useContext(EscolaLMSContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user.value) router.push("/");
  }, [mounted, user.value]);

  if (!mounted || !user.value) return null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#04323e]">Nachrichten</h1>
          <p className="text-[#555555] mt-1">Direktnachrichten mit Kursleiter:innen und Mitlernenden.</p>
        </div>

        {!CHAT_URL ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="text-3xl mb-4">💬</p>
            <p className="text-sm font-semibold text-[#04323e] mb-2">Messaging nicht konfiguriert</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Setze <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_CHAT_URL</code> auf die URL
              deiner Rocket.Chat-Instanz, um Direktnachrichten zu aktivieren.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: "70vh" }}>
            <iframe
              src={`${CHAT_URL}?layout=embedded`}
              className="w-full h-full border-0"
              title="Nachrichten"
              allow="camera; microphone"
            />
          </div>
        )}
      </main>
    </>
  );
}
