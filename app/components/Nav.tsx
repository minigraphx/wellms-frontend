"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { LoginForm } from "./LoginForm";

export function Nav() {
  const { user, logout, fetchMyCourses } = useContext(EscolaLMSContext);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loggedIn = mounted && !!user.value;
  const u = user.value;
  const initials = u
    ? `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
    : "";

  return (
    <>
      <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-[#04323e] hover:text-[#1abc9c] transition-colors">
          Wellms
        </Link>

        <div className="flex items-center gap-4">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${pathname === "/dashboard" ? "text-[#1abc9c]" : "text-[#555555] hover:text-[#04323e]"}`}
              >
                My courses
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="w-8 h-8 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] text-sm font-bold flex items-center justify-center hover:bg-[#1abc9c]/20 transition-colors"
                >
                  {(u as any)?.avatar ? (
                    <img src={(u as any).avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : initials}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-40">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-semibold text-[#04323e] truncate">{u?.first_name || u?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#04323e] transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-semibold bg-[#1abc9c] hover:bg-[#15a288] text-white px-5 py-1.5 rounded-full transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#04323e]">Sign in</h2>
              <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <LoginForm onSuccess={() => { setShowLogin(false); fetchMyCourses(); }} />
          </div>
        </div>
      )}
    </>
  );
}
