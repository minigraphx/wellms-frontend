"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { LoginForm } from "./LoginForm";
import { CartDrawer } from "./CartDrawer";
import type { API } from "@escolalms/sdk/lib";

export function Nav() {
  const { user, logout, fetchMyCourses, cart, fetchCart } = useContext(EscolaLMSContext);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user.value) fetchCart();
  }, [mounted, user.value]);

  const cartCount = useMemo(() => {
    const data = (cart as unknown as { value?: API.Cart })?.value;
    return data?.items?.length ?? 0;
  }, [cart]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  const loggedIn = mounted && !!user.value;
  const u = user.value;
  const initials = u
    ? `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
    : "";

  return (
    <>
      <nav className="border-b bg-white px-4 py-3 flex items-center justify-between relative z-30">
        <Link href="/" className="font-bold text-[#04323e] hover:text-[#1abc9c] transition-colors">
          Wellms
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/search"
            aria-label="Search courses"
            className={`text-sm transition-colors ${
              pathname === "/search" ? "text-[#1abc9c]" : "text-[#555555] hover:text-[#1abc9c]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <line x1="13.5" y1="13.5" x2="18" y2="18" />
            </svg>
          </Link>

          <button
            onClick={() => setShowCart(true)}
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            className="relative text-[#555555] hover:text-[#1abc9c] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1abc9c] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/dashboard" ? "text-[#1abc9c]" : "text-[#555555] hover:text-[#04323e]"
                }`}
              >
                My courses
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  aria-label="Open user menu"
                  className="w-8 h-8 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] text-sm font-bold flex items-center justify-center hover:bg-[#1abc9c]/20 transition-colors"
                >
                  {(u as any)?.avatar ? (
                    <img src={(u as any).avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-40">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs font-semibold text-[#04323e] truncate">
                        {u?.first_name || u?.email}
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                    >
                      Shop
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/bookmarks"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-[#555555] hover:bg-gray-50 hover:text-[#1abc9c] transition-colors"
                    >
                      Bookmarks
                    </Link>
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setShowMobileMenu((v) => !v)}
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
          aria-expanded={showMobileMenu}
          className="sm:hidden p-2 rounded-lg text-[#555555] hover:bg-gray-100 transition-colors"
        >
          {showMobileMenu ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-4 flex flex-col gap-3 z-20 shadow-sm">
          {loggedIn ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] text-sm font-bold flex items-center justify-center shrink-0">
                  {(u as any)?.avatar ? (
                    <img src={(u as any).avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <p className="text-sm font-semibold text-[#04323e] truncate">{u?.first_name || u?.email}</p>
              </div>
              <Link href="/search" className="text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Search courses
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                My courses
              </Link>
              <Link href="/shop" className="text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Shop
              </Link>
              <button
                onClick={() => { setShowCart(true); setShowMobileMenu(false); }}
                className="text-left text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1"
              >
                Cart {cartCount > 0 && `(${cartCount})`}
              </button>
              <Link href="/orders" className="text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Orders
              </Link>
              <Link href="/profile" className="text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Profile
              </Link>
              <button
                onClick={() => { logout(); setShowMobileMenu(false); }}
                className="text-left text-sm font-medium text-[#555555] hover:text-[#04323e] transition-colors py-1"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowLogin(true); setShowMobileMenu(false); }}
                className="w-full text-center text-sm font-semibold bg-[#1abc9c] hover:bg-[#15a288] text-white px-5 py-2.5 rounded-full transition-colors"
              >
                Sign in
              </button>
              <Link href="/search" className="text-center text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Search courses
              </Link>
              <Link href="/register" className="text-center text-sm font-medium text-[#555555] hover:text-[#1abc9c] transition-colors py-1">
                Create account
              </Link>
            </>
          )}
        </div>
      )}

      {/* Cart drawer */}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#04323e]">Sign in</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <LoginForm
              onSuccess={() => {
                setShowLogin(false);
                fetchMyCourses();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
