"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { useToast } from "../components/Toast";
import { useFormat, useT } from "../i18n/I18nProvider";
import type { API } from "@escolalms/sdk/lib";

type PaymentMethod = "stripe" | "p24";

const CURRENCY = "EUR";

function toAmount(cents: number | string | undefined): number {
  const n = typeof cents === "string" ? parseFloat(cents) : (cents ?? 0);
  return n / 100;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, payWithStripe, payWithP24, realizeVoucher, removeVoucher, user } =
    useContext(EscolaLMSContext);
  const { toast } = useToast();
  const t = useT();
  const { currency } = useFormat();
  const formatPrice = (cents: number | string | undefined) => currency(toAmount(cents), CURRENCY);

  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [submitting, setSubmitting] = useState(false);

  const [voucher, setVoucher] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

  const [billing, setBilling] = useState<API.InvoiceData>({
    client_email: "",
    client_name: "",
    client_street: "",
    client_street_number: "",
    client_postal: "",
    client_city: "",
    client_country: "",
    client_company: "",
    client_taxid: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) {
      router.push("/");
    }
  }, [mounted, user.value]);

  // Pre-fill email from user profile
  useEffect(() => {
    if (user.value?.email) {
      setBilling((b) => ({ ...b, client_email: b.client_email || user.value!.email }));
    }
  }, [user.value]);

  const cartData = (cart as unknown as { value?: API.Cart })?.value;
  const items = cartData?.items ?? [];
  const total = cartData?.total_with_tax ?? cartData?.total;

  const handleVoucher = useCallback(async () => {
    if (!voucher.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await realizeVoucher(voucher.trim());
      if ((res as any)?.success) {
        await fetchCart();
        toast(t.shop.voucherApplied);
      } else {
        toast((res as any)?.data?.message ?? t.shop.invalidVoucher, "error");
      }
    } catch {
      toast(t.shop.invalidVoucher, "error");
    } finally {
      setVoucherLoading(false);
    }
  }, [voucher, realizeVoucher, fetchCart, toast, t]);

  const handleRemoveVoucher = useCallback(async () => {
    await removeVoucher();
    await fetchCart();
    setVoucher("");
    toast(t.shop.voucherRemoved);
  }, [removeVoucher, fetchCart, toast, t]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (items.length === 0) return;
      setSubmitting(true);
      try {
        const returnUrl = `${window.location.origin}/orders?success=1`;
        if (method === "stripe") {
          await payWithStripe("", returnUrl);
        } else {
          await payWithP24(billing.client_email, returnUrl, billing);
        }
        // Stripe will redirect; P24 may redirect or resolve
      } catch (err: any) {
        toast(err?.message ?? t.shop.paymentFailed, "error");
        setSubmitting(false);
      }
    },
    [items, method, billing, payWithStripe, payWithP24, toast, t]
  );

  if (!mounted) return null;

  if (!user.value) return null;

  if (items.length === 0) {
    return (
      <>
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-4xl mb-4">🛒</p>
          <h1 className="text-2xl font-bold text-[#04323e] mb-3">{t.shop.cartEmptyTitle}</h1>
          <Link href="/shop" className="text-[#1abc9c] hover:underline">{t.shop.browseShop}</Link>
        </main>
      </>
    );
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]";
  const labelClass = "block text-xs font-medium text-[#04323e] mb-1";

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/shop" className="hover:text-[#1abc9c] transition-colors">{t.nav.shop}</Link>
        <span className="mx-2">›</span>
        <span className="text-[#04323e]">{t.shop.checkout}</span>
      </nav>

      <h1 className="text-3xl font-bold text-[#04323e] mb-8">{t.shop.checkout}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: payment & billing */}
        <div className="md:col-span-2 space-y-6">
          {/* Payment method */}
          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">{t.shop.paymentMethod}</h2>
            <div className="flex gap-3">
              <label className={`flex items-center gap-3 flex-1 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${method === "stripe" ? "border-[#1abc9c] bg-[#1abc9c]/5" : "border-gray-200"}`}>
                <input
                  type="radio"
                  name="method"
                  value="stripe"
                  checked={method === "stripe"}
                  onChange={() => setMethod("stripe")}
                  className="accent-[#1abc9c]"
                />
                <span className="text-sm font-medium text-[#04323e]">{t.shop.card}</span>
              </label>
              <label className={`flex items-center gap-3 flex-1 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${method === "p24" ? "border-[#1abc9c] bg-[#1abc9c]/5" : "border-gray-200"}`}>
                <input
                  type="radio"
                  name="method"
                  value="p24"
                  checked={method === "p24"}
                  onChange={() => setMethod("p24")}
                  className="accent-[#1abc9c]"
                />
                <span className="text-sm font-medium text-[#04323e]">Przelewy24 (P24)</span>
              </label>
            </div>
          </section>

          {/* Billing details (required for P24, optional for Stripe) */}
          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#04323e] mb-4">{t.shop.billingDetails}</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t.shop.email} {method === "p24" && <span className="text-red-500">*</span>}</label>
                <input
                  type="email"
                  value={billing.client_email}
                  onChange={(e) => setBilling((b) => ({ ...b, client_email: e.target.value }))}
                  required={method === "p24"}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.shop.fullName}</label>
                  <input
                    type="text"
                    value={billing.client_name}
                    onChange={(e) => setBilling((b) => ({ ...b, client_name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.shop.companyOptional}</label>
                  <input
                    type="text"
                    value={billing.client_company}
                    onChange={(e) => setBilling((b) => ({ ...b, client_company: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.shop.taxIdOptional}</label>
                <input
                  type="text"
                  value={billing.client_taxid}
                  onChange={(e) => setBilling((b) => ({ ...b, client_taxid: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>{t.shop.street}</label>
                  <input
                    type="text"
                    value={billing.client_street}
                    onChange={(e) => setBilling((b) => ({ ...b, client_street: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.shop.streetNumber}</label>
                  <input
                    type="text"
                    value={billing.client_street_number}
                    onChange={(e) => setBilling((b) => ({ ...b, client_street_number: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{t.shop.postalCode}</label>
                  <input
                    type="text"
                    value={billing.client_postal}
                    onChange={(e) => setBilling((b) => ({ ...b, client_postal: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.shop.city}</label>
                  <input
                    type="text"
                    value={billing.client_city}
                    onChange={(e) => setBilling((b) => ({ ...b, client_city: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.shop.country}</label>
                  <input
                    type="text"
                    value={billing.client_country}
                    onChange={(e) => setBilling((b) => ({ ...b, client_country: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: order summary */}
        <aside className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[#04323e]">{t.shop.orderSummary}</h2>

            <ul className="space-y-3">
              {items.map((item, i) => {
                const name = item.product?.name ?? t.shop.item(i + 1);
                const price = item.total_with_tax ?? (item as any).price ?? 0;
                return (
                  <li key={i} className="flex justify-between text-sm text-[#555555]">
                    <span className="truncate mr-3">{name}</span>
                    <span className="shrink-0 font-medium">{formatPrice(price)}</span>
                  </li>
                );
              })}
            </ul>

            {/* Voucher */}
            {cartData?.coupon ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1abc9c]">{t.shop.coupon(cartData.coupon)}</span>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  {t.shop.remove}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  placeholder={t.shop.voucherCode}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]"
                />
                <button
                  type="button"
                  onClick={handleVoucher}
                  disabled={voucherLoading || !voucher.trim()}
                  className="text-sm font-semibold text-[#1abc9c] hover:text-[#15a288] disabled:opacity-40 transition-colors"
                >
                  {t.shop.apply}
                </button>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-[#04323e]">
              <span>{t.shop.total}</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {submitting ? t.shop.processing : t.shop.pay(formatPrice(total))}
            </button>

            <p className="text-xs text-gray-400 text-center">
              {t.shop.terms}
            </p>
          </div>
        </aside>
      </form>
      </main>
    </>
  );
}
