"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";
import { products } from "@/data/products";

const CartCheckoutSection = dynamic(() => import("./CartCheckoutSection"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
      Загрузка оформления заказа...
    </div>
  ),
});

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const rate = useCurrencyStore((s) => s.rate);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawStatus = (session?.user as any)?.status as number | undefined;
  const isAuthorized = Number.isFinite(rawStatus);
  const partnerGroup = isAuthorized ? (rawStatus as 1 | 2 | 3) : undefined;

  const calcItemFinalRub = (
    itemId: string,
    itemPriceRub?: number,
    itemPriceEur?: number
  ) => {
    const product = products.find((p) => p.id === itemId);
    const priceRub =
      itemPriceRub ??
      product?.priceRub ??
      (product?.priceEur != null && rate ? product.priceEur * rate : undefined) ??
      (itemPriceEur != null && rate ? itemPriceEur * rate : undefined);
    if (priceRub == null || priceRub <= 0) return undefined;

    let discountPercent: number | undefined;
    if (partnerGroup === 1) discountPercent = product?.partnerDiscount1;
    if (partnerGroup === 2) discountPercent = product?.partnerDiscount2;
    if (partnerGroup === 3) discountPercent = product?.partnerDiscount3;

    const hasDiscount = isAuthorized && discountPercent != null;
    return hasDiscount
      ? Math.round(priceRub * (1 - discountPercent! / 100))
      : priceRub;
  };

  const totalPriceRub = items.reduce((sum, item) => {
    const finalRub = calcItemFinalRub(item.id, item.priceRub, item.priceEur);
    if (finalRub == null) return sum;
    return sum + finalRub * item.quantity;
  }, 0);

  const totalPriceFormatted = formatPrice(undefined, totalPriceRub, rate);
  const isEmptyCart = items.length === 0 && !success;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-6">
          <nav className="mb-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#003366]">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#0b1f33]">Корзина</span>
          </nav>
          <h1 className="mb-6 text-xl font-semibold text-[#0b1f33] md:text-2xl">
            Корзина
          </h1>

          {isEmptyCart ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-slate-200/60">
              <h2 className="mb-4 text-xl font-semibold text-[#0b1f33]">
                Корзина пуста
              </h2>
              <p className="mb-6 text-slate-600">
                Добавьте товары из каталога, чтобы оформить заказ.
              </p>
              <Link
                href="/"
                className="inline-block rounded-xl bg-[#FF8C00] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg"
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-8 w-8 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="6" width="18" height="11" rx="2" />
                          <path d="M3 14h18" />
                          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                          <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.id}`}
                          className="font-medium text-slate-900 hover:text-[#003366]"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-500">Артикул: {item.id}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          aria-label="Уменьшить"
                        >
                          −
                        </button>
                        <span className="flex h-9 min-w-[2.5rem] items-center justify-center border-x border-slate-200 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          aria-label="Увеличить"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-base font-semibold text-slate-900">
                        {(() => {
                          const finalRub = calcItemFinalRub(
                            item.id,
                            item.priceRub,
                            item.priceEur
                          );
                          const fallback = formatPrice(
                            item.priceEur != null
                              ? item.priceEur * item.quantity
                              : undefined,
                            item.priceRub != null
                              ? item.priceRub * item.quantity
                              : undefined,
                            rate
                          );
                          if (finalRub == null) return fallback;
                          return formatPrice(
                            undefined,
                            finalRub * item.quantity,
                            rate
                          );
                        })()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Удалить"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <CartCheckoutSection
                success={success}
                orderNumber={orderNumber}
                error={error}
                totalPriceFormatted={totalPriceFormatted}
                loading={loading}
                onSubmit={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    const res = await fetch("/api/order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        items: items.map((i) => {
                          const finalRub = calcItemFinalRub(
                            i.id,
                            i.priceRub,
                            i.priceEur
                          );
                          if (finalRub != null) {
                            return {
                              id: i.id,
                              name: i.name,
                              quantity: i.quantity,
                              priceRub: finalRub,
                            };
                          }
                          return {
                            id: i.id,
                            name: i.name,
                            quantity: i.quantity,
                            priceEur: i.priceEur,
                            priceRub: i.priceRub,
                          };
                        }),
                        totalPrice: totalPriceFormatted
                          .replace(/\s/g, " ")
                          .replace(" ₽", ""),
                        rate,
                      }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok) {
                      throw new Error(
                        (data &&
                          typeof data === "object" &&
                          "error" in data &&
                          (data as any).error) ||
                          "Ошибка отправки заказа"
                      );
                    }
                    setOrderNumber(
                      data && typeof data === "object" && "orderNumber" in data
                        ? String((data as any).orderNumber)
                        : null
                    );
                    setSuccess(true);
                    clearCart();
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Ошибка отправки заказа"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
