"use client";

import Link from "next/link";
import type { API } from "@escolalms/sdk/lib";

interface ProductCardProps {
  product: API.Product;
  onAddToCart?: (id: number) => void;
  cartLoading?: boolean;
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en", { style: "currency", currency: "EUR" });
}

export function ProductCard({ product, onAddToCart, cartLoading }: ProductCardProps) {
  const courseCount = product.productables?.length ?? 0;
  const isSubscription = !!product.subscription_period;
  const isFree = product.gross_price === 0;

  return (
    <div className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col">
      <Link href={`/shop/${product.id}`} className="block">
        {product.poster_url ? (
          <img src={product.poster_url} alt={product.name ?? ""} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">
            🛍
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex gap-2 mb-2 flex-wrap">
          {product.owned && (
            <span className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-2 py-0.5 rounded-full">
              Owned
            </span>
          )}
          {isSubscription && (
            <span className="text-xs font-medium bg-[#04323e]/10 text-[#04323e] px-2 py-0.5 rounded-full">
              Subscription
            </span>
          )}
          {courseCount > 1 && (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Bundle · {courseCount} courses
            </span>
          )}
          {product.tags?.map((tag) => (
            <span key={tag} className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <Link href={`/shop/${product.id}`} className="group-hover:text-[#1abc9c] transition-colors">
          <h2 className="font-semibold text-[#04323e]">{product.name}</h2>
        </Link>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-[#04323e]">
            {isFree ? (
              <span className="text-[#1abc9c]">Free</span>
            ) : (
              <>
                {formatPrice(product.gross_price)}
                {isSubscription && (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    / {product.subscription_period}
                  </span>
                )}
              </>
            )}
          </p>

          {!product.owned && onAddToCart && (
            <button
              onClick={() => onAddToCart(Number(product.id))}
              disabled={cartLoading}
              className="text-sm font-semibold bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white px-4 py-2 rounded-full transition-colors shrink-0"
            >
              {cartLoading ? "Adding…" : "Add to cart"}
            </button>
          )}

          {product.owned && (
            <Link
              href={`/shop/${product.id}`}
              className="text-sm font-semibold border border-[#1abc9c] text-[#1abc9c] hover:bg-[#1abc9c]/5 px-4 py-2 rounded-full transition-colors shrink-0"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
