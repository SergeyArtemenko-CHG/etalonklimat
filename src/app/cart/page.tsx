"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";
import RetailPriceLabel from "@/components/RetailPriceLabel";
import { products } from "@/data/products";
import { getProductHref, buildProductImageAlt, resolveProductImageSeoSrc } from "@/lib/product-url";

const CartCheckoutSection = dynamic(() => import("./CartCheckoutSection"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 rounded-xl border border-text-muted/25 bg-card-bg p-4 text-sm text-text-muted shadow-sm">
      Загрузка оформления заказа...
    </div>
  ),
});

function CartProductThumb({ src, name, sku }: { src?: string; name: string; sku: string }) {
  const [failed, setFailed] = useState(false);
  const seoSource = { name, sku };
  const usePlaceholder = !src?.trim() || failed;
  const imageSrc = resolveProductImageSeoSrc(src, seoSource, usePlaceholder);
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-text-muted/25 bg-card-bg">
      <Image
        src={imageSrc}
        alt={buildProductImageAlt(seoSource)}
        fill
        className="object-contain p-1"
        sizes="64px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

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
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-6">
          <nav className="mb-6 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-primary">Корзина</span>
          </nav>
          <h1 className="mb-6 text-xl font-semibold text-primary md:text-2xl">
            Корзина
          </h1>

          {isEmptyCart ? (
            <div className="rounded-2xl bg-card-bg p-8 text-center shadow-md shadow-text-muted/8">
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Корзина пуста
              </h2>
              <p className="mb-6 text-text-muted">
                Добавьте товары из каталога, чтобы оформить заказ.
              </p>
              <Link
                href="/"
                className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover hover:shadow-lg"
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  const imageSrc = item.image?.trim() || product?.image?.trim();
                  const article =
                    item.sku?.trim() || product?.sku?.trim() || item.id;

                  return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-text-muted/25 bg-card-bg p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <CartProductThumb src={imageSrc} name={item.name} sku={article} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={getProductHref({
                            id: item.id,
                            sku: article,
                            name: item.name,
                            slug: product?.slug,
                          })}
                          className="font-medium text-text-main hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-text-muted">Артикул: {article}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center overflow-hidden rounded-lg border border-text-muted/25">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center bg-main-bg text-text-muted transition hover:bg-text-muted/20"
                          aria-label="Уменьшить"
                        >
                          −
                        </button>
                        <span className="flex h-9 min-w-[2.5rem] items-center justify-center border-x border-text-muted/25 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center bg-main-bg text-text-muted transition hover:bg-text-muted/20"
                          aria-label="Увеличить"
                        >
                          +
                        </button>
                      </div>
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-semibold text-text-main">
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
                        <RetailPriceLabel
                          show={
                            !isAuthorized &&
                            calcItemFinalRub(item.id, item.priceRub, item.priceEur) != null
                          }
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded px-2 py-1 text-sm text-text-muted hover:bg-red-50 hover:text-red-600"
                        aria-label="Удалить"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>

              <CartCheckoutSection
                success={success}
                orderNumber={orderNumber}
                error={error}
                totalPriceFormatted={totalPriceFormatted}
                showRetailPriceLabel={!isAuthorized && totalPriceRub > 0}
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
