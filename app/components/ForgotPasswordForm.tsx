"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { useT } from "../i18n/I18nProvider";

export function ForgotPasswordForm() {
  const { forgot } = useContext(EscolaLMSContext);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgot({
        email,
        return_url: window.location.origin + "/reset-password",
      });
      if (res.success) {
        setSent(true);
      } else {
        setError(t.common.error);
      }
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[#1abc9c]/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[#1abc9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[#04323e] font-semibold">{t.auth.checkYourEmail}</p>
        <p className="text-sm text-gray-500">
          {t.auth.resetLinkSentPrefix}
          <strong>{email}</strong>
          {t.auth.resetLinkSentSuffix}
        </p>
        <Link href="/" className="block text-sm text-[#1abc9c] hover:underline">{t.auth.backToSignIn}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">{t.auth.forgotIntro}</p>
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.email}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition-colors"
      >
        {loading ? t.auth.sending : t.auth.sendResetLink}
      </button>
      <p className="text-center text-sm text-gray-400">
        <Link href="/" className="text-[#1abc9c] hover:underline">{t.auth.backToSignIn}</Link>
      </p>
    </form>
  );
}
