"use client";

import { useContext, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { useT } from "../i18n/I18nProvider";

export function ResetPasswordForm() {
  const { reset } = useContext(EscolaLMSContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError(t.auth.passwordsDontMatch);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setLoading(true);
    try {
      const res = await reset({ token, email, password });
      if (res.success) {
        router.push("/?resetSuccess=1");
      } else {
        setError(t.auth.invalidOrExpiredLink);
      }
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600 text-sm">{t.auth.invalidResetLink}</p>
        <Link href="/forgot-password" className="text-[#1abc9c] hover:underline text-sm">{t.auth.requestNewOne}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.newPassword}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.confirmNewPassword}</label>
        <input
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
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
        {loading ? t.auth.resetting : t.auth.resetPassword}
      </button>
    </form>
  );
}
