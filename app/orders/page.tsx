"use client";

import { Suspense, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { useToast } from "../components/Toast";
import { useFormat, useT } from "../i18n/I18nProvider";
import { orderStatusOf, type OrderStatus } from "../i18n/messages/shop";
import type { API } from "@escolalms/sdk/lib";

const CURRENCY = "EUR";
const ORDER_DATE: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

const STATUS_COLORS: Record<OrderStatus, string> = {
  paid: "text-[#1abc9c] bg-[#1abc9c]/10",
  cancelled: "text-red-500 bg-red-50",
  pending: "text-[#b8850a] bg-[#f2c94c]/20",
};

// useSearchParams() needs a Suspense boundary, or prerendering fails at build time.
export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchOrders, fetchOrderInvoice, user } = useContext(EscolaLMSContext);
  const { toast } = useToast();
  const t = useT();
  const { currency, date } = useFormat();
  const formatPrice = (cents: number) => currency(cents / 100, CURRENCY);
  const formatDate = (str: string | null) => (str ? date(str, ORDER_DATE) : "—");

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<API.Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) {
      router.push("/");
      return;
    }
    setLoading(true);
    fetchOrders()
      .then((res: any) => {
        const data: API.Order[] = res?.data ?? [];
        setOrders(data);
      })
      .finally(() => setLoading(false));
  }, [mounted, user.value]);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast(t.shop.paymentSuccess, "success");
    }
  }, []);

  const handleDownloadInvoice = useCallback(
    async (orderId: number) => {
      setDownloadingId(orderId);
      try {
        const blob = await fetchOrderInvoice(orderId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast(t.shop.invoiceDownloadFailed, "error");
      } finally {
        setDownloadingId(null);
      }
    },
    [fetchOrderInvoice, toast, t]
  );

  if (!mounted || !user.value) return null;

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#04323e] mb-8">{t.shop.orderHistory}</h1>

      {loading && <p className="text-gray-500">{t.common.loading}</p>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-gray-400 text-lg mb-4">{t.shop.noOrders}</p>
          <Link href="/shop" className="text-[#1abc9c] hover:underline">{t.shop.browseShop}</Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const status = orderStatusOf(order.status);
          const label = t.shop.orderStatus[status];
          const color = STATUS_COLORS[status];
          return (
            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-[#04323e]">{t.shop.orderNumber(order.id)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-bold text-[#04323e]">{formatPrice(order.total)}</p>
                  <button
                    onClick={() => handleDownloadInvoice(order.id)}
                    disabled={downloadingId === order.id}
                    className="text-sm font-medium text-[#1abc9c] hover:text-[#15a288] disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {downloadingId === order.id ? t.shop.downloading : `↓ ${t.shop.invoice}`}
                  </button>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-gray-50 pt-4">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm text-[#555555]">
                      <span>{item.name ?? item.product?.name ?? t.shop.item(i + 1)}</span>
                      <span className="font-medium">{formatPrice((item as any).price ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Billing address if available */}
              {order.client_name && (
                <p className="text-xs text-gray-400 mt-3">
                  {order.client_name}
                  {order.client_company && ` · ${order.client_company}`}
                  {order.client_city && `, ${order.client_city}`}
                  {order.client_country && `, ${order.client_country}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
      </main>
    </>
  );
}
