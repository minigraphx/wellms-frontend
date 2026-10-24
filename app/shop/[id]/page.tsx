"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../../components/Nav";
import { useToast } from "../../components/Toast";
import { useFormat, useT } from "../../i18n/I18nProvider";
import type { API } from "@escolalms/sdk/lib";

const CURRENCY = "EUR";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const { fetchProducts, user, addToCart, fetchCart } = useContext(EscolaLMSContext);
  const { toast } = useToast();
  const t = useT();
  const { currency, date } = useFormat();
  const formatPrice = (cents: number) => currency(cents / 100, CURRENCY);

  const [product, setProduct] = useState<API.Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // fetchProducts with a large per_page and pick by id — SDK getSingleProduct isn't in context
    fetchProducts({ per_page: 100 })
      .then((res: any) => {
        const items: API.Product[] = res?.data ?? [];
        const found = items.find((p) => Number(p.id) === productId) ?? null;
        setProduct(found);
      })
      .finally(() => setLoading(false));
  }, [productId, fetchProducts]);

  const handleAddToCart = useCallback(async () => {
    if (!user.value) {
      toast(t.shop.signInToContinue, "error");
      return;
    }
    setCartLoading(true);
    try {
      const res = await addToCart(productId);
      if ((res as any)?.success !== false) {
        await fetchCart();
        toast(t.shop.addedToCart);
        router.push("/checkout");
      } else {
        toast(t.shop.addToCartFailed, "error");
      }
    } catch {
      toast(t.shop.addToCartFailed, "error");
    } finally {
      setCartLoading(false);
    }
  }, [productId, user.value, addToCart, fetchCart, toast, router, t]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-gray-500">{t.common.loading}</div>;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400 mb-4">{t.shop.productNotFound}</p>
        <Link href="/shop" className="text-[#1abc9c] hover:underline">{t.shop.backToShop}</Link>
      </div>
    );
  }

  const isSubscription = !!product.subscription_period;
  const isFree = product.gross_price === 0;
  const courseCount = product.productables?.length ?? 0;

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/shop" className="hover:text-[#1abc9c] transition-colors">{t.nav.shop}</Link>
        <span className="mx-2">›</span>
        <span className="text-[#04323e]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {product.poster_url && (
            <img src={product.poster_url} alt={product.name ?? ""} className="w-full rounded-xl object-cover mb-6 aspect-video" />
          )}

          <div className="flex gap-2 mb-4 flex-wrap">
            {courseCount > 1 && (
              <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {t.shop.bundle(courseCount)}
              </span>
            )}
            {isSubscription && (
              <span className="text-xs font-medium bg-[#04323e]/10 text-[#04323e] px-3 py-1 rounded-full">
                {t.shop.subscriptionPeriod(product.subscription_period ?? "")}
              </span>
            )}
            {product.tags?.map((tag) => (
              <span key={tag} className="text-xs font-medium bg-[#1abc9c]/10 text-[#1abc9c] px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-[#04323e] mb-4">{product.name}</h1>

          {/* Included courses */}
          {product.productables && product.productables.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-[#04323e] mb-4">
                {courseCount > 1 ? t.shop.includedInBundle : t.shop.courseIncluded}
              </h2>
              <ul className="space-y-3">
                {product.productables.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl bg-white">
                    <span className="text-[#1abc9c] mt-0.5 shrink-0">✓</span>
                    <div>
                      <p className="font-medium text-[#04323e]">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-[#555555] mt-1">{item.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related products */}
          {product.related_products && product.related_products.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-[#04323e] mb-4">{t.shop.relatedProducts}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.related_products.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/shop/${rel.id}`}
                    className="block p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white"
                  >
                    <p className="font-medium text-[#04323e]">{rel.name}</p>
                    <p className="text-sm text-[#1abc9c] mt-1 font-semibold">
                      {rel.gross_price === 0 ? t.shop.free : formatPrice(rel.gross_price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky buy card */}
        <aside className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm h-fit space-y-4 md:sticky md:top-6">
          <p className="text-3xl font-bold text-[#04323e]">
            {isFree ? (
              <span className="text-[#1abc9c]">{t.shop.free}</span>
            ) : (
              <>
                {formatPrice(product.gross_price)}
                {isSubscription && (
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    / {product.subscription_period}
                  </span>
                )}
              </>
            )}
          </p>

          {product.end_date && (
            <p className="text-xs text-gray-400">{t.shop.accessUntil(date(product.end_date))}</p>
          )}

          {product.owned ? (
            <>
              <p className="text-sm text-[#1abc9c] font-medium">✓ {t.shop.youOwnThis}</p>
              {product.productables?.[0] && (
                <Link
                  href={`/courses/${(product.productables[0] as any).productable_id}`}
                  className="block w-full text-center bg-[#1abc9c] hover:bg-[#15a288] text-white font-semibold py-3 rounded-full transition-colors"
                >
                  {t.shop.goToCourse}
                </Link>
              )}
            </>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="w-full bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {cartLoading ? t.shop.adding : isFree ? t.shop.getForFree : t.shop.addToCart}
            </button>
          )}

          <Link href="/shop" className="block text-center text-sm text-gray-400 hover:text-[#1abc9c] transition-colors">
            ← {t.shop.backToShop}
          </Link>
        </aside>
      </div>
      </main>
    </>
  );
}
