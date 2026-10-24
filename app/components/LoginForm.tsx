"use client";

import { useContext, useId, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { loginErrorKey, type LoginErrorKey } from "./authErrors";
import { useT } from "../i18n/I18nProvider";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useContext(EscolaLMSContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginErrorKey | null>(null);
  const [loading, setLoading] = useState(false);
  const id = useId();
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.success) {
        onSuccess?.();
      } else {
        setError(loginErrorKey(res));
      }
    } catch (err) {
      setError(loginErrorKey(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.email}</label>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={`${id}-password`} className="block text-sm font-medium text-[#04323e]">{t.auth.password}</label>
          <a href="/forgot-password" className="text-xs text-[#1abc9c] hover:underline">{t.auth.forgotPassword}</a>
        </div>
        <input
          id={`${id}-password`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      {error && <p className="text-sm text-red-600">{t.auth[error]}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition-colors"
      >
        {loading ? t.auth.signingIn : t.common.signIn}
      </button>
      <p className="text-center text-sm text-gray-400">
        {t.auth.noAccount}{" "}
        <a href="/register" className="text-[#1abc9c] hover:underline font-medium">{t.auth.createOne}</a>
      </p>
    </form>
  );
}
