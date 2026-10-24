"use client";

import Link from "next/link";
import { SITE_NAME } from "../lib/seo";
import { useT } from "../i18n/I18nProvider";
import { RegisterForm } from "../components/RegisterForm";

export default function RegisterPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#04323e] hover:text-[#1abc9c] transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-[#04323e] mt-2">{t.auth.createYourAccount}</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
