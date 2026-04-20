"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";

export function RegisterForm() {
  const { register, login } = useContext(EscolaLMSContext);
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
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
        } else {
          router.push("/");
        }
      } else {
        const msg = (res as any)?.data?.message || (res as any)?.data?.errors?.email?.[0];
        setError(msg || "Registration failed. Please try again.");
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#04323e] mb-1">First name</label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#04323e] mb-1">Last name</label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#04323e] mb-1">Confirm password</label>
        <input
          type="password"
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
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/" className="text-[#1abc9c] hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  );
}
