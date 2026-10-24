"use client";

import { useContext, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { isEmailNotConfirmed } from "./authErrors";
import { useT } from "../i18n/I18nProvider";

export function RegisterForm() {
  const { register, login } = useContext(EscolaLMSContext);
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState("");
  const id = useId();
  const t = useT();

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) {
      setError(t.auth.passwordsDontMatch);
      return;
    }
    if (form.password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        return_url: window.location.origin + "/register",
      });
      if (res.success) {
        const loginRes = await login({ email: form.email, password: form.password });
        if (loginRes.success) {
          router.push("/dashboard");
        } else if (isEmailNotConfirmed(loginRes)) {
          // The backend sends a confirmation link; login only works after it was clicked.
          setConfirmationSentTo(form.email);
        } else {
          router.push("/");
        }
      } else {
        const msg = (res as any)?.data?.message || (res as any)?.data?.errors?.email?.[0];
        setError(msg || t.auth.registrationFailed);
      }
    } catch {
      setError(t.auth.registrationFailed);
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSentTo) {
    return (
      <div className="space-y-3 text-center" role="status">
        <h2 className="text-lg font-semibold text-[#04323e]">{t.auth.accountCreated}</h2>
        <p className="text-sm text-[#555555]">
          {t.auth.confirmationSentPrefix}
          <strong>{confirmationSentTo}</strong>
          {t.auth.confirmationSentSuffix}
        </p>
        <Link href="/" className="inline-block text-sm text-[#1abc9c] hover:underline font-medium">{t.auth.goToSignIn}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-first_name`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.firstName}</label>
          <input
            type="text"
            id={`${id}-first_name`}
          value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
          />
        </div>
        <div>
          <label htmlFor={`${id}-last_name`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.lastName}</label>
          <input
            type="text"
            id={`${id}-last_name`}
          value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.email}</label>
        <input
          type="email"
          id={`${id}-email`}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <label htmlFor={`${id}-password`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.password}</label>
        <input
          type="password"
          id={`${id}-password`}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <label htmlFor={`${id}-password_confirmation`} className="block text-sm font-medium text-[#04323e] mb-1">{t.auth.confirmPassword}</label>
        <input
          type="password"
          id={`${id}-password_confirmation`}
          value={form.password_confirmation}
          onChange={(e) => set("password_confirmation", e.target.value)}
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
        {loading ? t.auth.creatingAccount : t.common.createAccount}
      </button>
      <p className="text-center text-sm text-gray-400">
        {t.auth.haveAccount}{" "}
        <Link href="/" className="text-[#1abc9c] hover:underline font-medium">{t.common.signIn}</Link>
      </p>
    </form>
  );
}
