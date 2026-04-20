"use client";

import { useCallback, useContext } from "react";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import type { API } from "@escolalms/sdk/lib";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function formatPrice(cents: number | string | undefined): string {
  const n = typeof cents === "string" ? parseFloat(cents) : (cents ?? 0);
  return (n / 100).toLocaleString("en", { style: "currency", currency: "EUR" });
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, fetchCart } = useContext(EscolaLMSContext);
  const cartData = (cart as unknown as { value?: API.Cart })?.value;
  const items = cartData?.items ?? [];

  const handleRemove = useCallback(
    async (productId: number) => {
      await removeFromCart(productId);
      fetchCart();
    },
    [removeFromCart, fetchCart]
  );

  if (!open) return null;

  const total = cartData?.total_with_tax ?? cartData?.total;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#04323e]">Cart</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-gray-400">Your cart is empty.</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-[#1abc9c] hover:underline"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            items.map((item, i) => {
              const name = item.product?.name ?? `Item ${i + 1}`;
              const price = item.total_with_tax ?? (item as any).price ?? 0;
              const productId = item.product_id ?? Number(item.product?.id);
              return (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0">
                  {item.product?.poster_url && (
                    <img src={item.product.poster_url} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#04323e] text-sm truncate">{name}</p>
                    <p className="text-[#1abc9c] font-semibold text-sm mt-0.5">{formatPrice(price)}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(productId)}
                    aria-label="Remove item"
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg shrink-0"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 space-y-4">
            {cartData?.coupon && (
              <p className="text-sm text-[#1abc9c]">Coupon applied: {cartData.coupon}</p>
            )}
            <div className="flex justify-between text-sm font-medium text-[#04323e]">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full text-center bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-3 rounded-full transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
