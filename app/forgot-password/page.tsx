"use client";

import Link from "next/link";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#04323e] hover:text-[#1abc9c] transition-colors">
            Wellms
          </Link>
          <h1 className="text-xl font-semibold text-[#04323e] mt-2">Reset your password</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
