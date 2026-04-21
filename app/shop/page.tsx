"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { ProductCard } from "../components/ProductCard";
import { useToast } from "../components/Toast";
import type { API } from "@escolalms/sdk/lib";

export default function ShopPage() {
  const { fetchProducts, user, addToCart, fetchCart } = useContext(EscolaLMSContext);
  const { toast } = useToast();

  const [products, setProducts] = useState<API.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cartLoadingId, setCartLoadingId] = useState<number | null>(null);
  const appendRef = useRef(false);

  const load = useCallback(
    async (p: number, append: boolean) => {
      if (!append) setLoading(true);
      try {
        const res = await fetchProducts({ page: p, per_page: 12 });
        const items = (res as any)?.data ?? [];
        const meta = (res as any)?.meta;
        if (append) {
          setProducts((prev) => [...prev, ...items]);
        } else {
          setProducts(items);
        }
        setHasMore(meta ? p < meta.last_page : false);
      } finally {
        if (!append) setLoading(false);
      }
    },
    [fetchProducts]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const handleLoadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  }, [page, load]);

  const handleAddToCart = useCallback(
    async (id: number) => {
      if (!user.value) {
        toast("Please sign in to add items to your cart.", "error");
        return;
      }
      setCartLoadingId(id);
      try {
        const res = await addToCart(id);
        if ((res as any)?.success !== false) {
          await fetchCart();
          toast("Added to cart!");
        } else {
          toast("Failed to add to cart.", "error");
        }
      } catch {
        toast("Failed to add to cart.", "error");
      } finally {
        setCartLoadingId(null);
      }
    },
    [user.value, addToCart, fetchCart, toast]
  );

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#04323e] mb-2">Shop</h1>
        <p className="text-[#555555] mb-8">Courses, bundles and subscriptions</p>

        {loading && products.length === 0 && (
          <p className="text-gray-500">Loading…</p>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products available yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              cartLoading={cartLoadingId === Number(product.id)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              className="px-8 py-2.5 rounded-full border border-[#1abc9c] text-[#1abc9c] font-semibold text-sm hover:bg-[#1abc9c] hover:text-white transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </main>
    </>
  );
}
