"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPriceRub } = useCartStore();
  const rate = useCurrencyStore((s) => s.rate);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPriceRub = getTotalPriceRub(rate);
  const totalPriceFormatted = formatPrice(undefined, totalPriceRub, rate);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl bg-white p-8 shadow-md shadow-slate-200/60 text-center">
            <h1 className="mb-4 text-xl font-semibold text-[#0b1f33]">
              Корзина пуста
            </h1>
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
        </main>
        <Footer />
      </div>
    );
  }

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
                    {formatPrice(
                      item.priceEur != null
                        ? item.priceEur * item.quantity
                        : undefined,
                      item.priceRub != null
                        ? item.priceRub * item.quantity
                        : undefined,
                      rate
                    )}
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

          <div className="mt-8 space-y-6">
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                <p className="font-semibold">Заказ успешно оформлен!</p>
                <p className="mt-1 text-sm">Мы свяжемся с вами в ближайшее время.</p>
                <Link
                  href="/"
                  className="mt-3 inline-block text-sm font-medium text-green-700 underline hover:no-underline"
                >
                  Вернуться в каталог
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-medium text-slate-700">Контактные данные для заказа</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <label className="flex-1">
                      <span className="mb-1 block text-xs text-slate-500">Имя</span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Иван Иванов"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                        required
                      />
                    </label>
                    <label className="flex-1">
                      <span className="mb-1 block text-xs text-slate-500">Телефон</span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                        required
                      />
                    </label>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-bold text-slate-900">
                    Итого: {totalPriceFormatted}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Скачать коммерческое предложение (PDF)
                    </button>
                    <button
                      type="button"
                      disabled={loading || !customerName.trim() || !customerPhone.trim()}
                      onClick={async () => {
                        setError(null);
                        setLoading(true);
                        try {
                          const res = await fetch("/api/order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              items: items.map((i) => ({
                                id: i.id,
                                name: i.name,
                                quantity: i.quantity,
                                priceEur: i.priceEur,
                                priceRub: i.priceRub,
                              })),
                              totalPrice: totalPriceFormatted.replace(/\s/g, " ").replace(" ₽", ""),
                              rate,
                              customerName: customerName.trim(),
                              customerPhone: customerPhone.trim(),
                            }),
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data.error || "Ошибка отправки заказа");
                          }
                          setSuccess(true);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Ошибка отправки заказа");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-[#FF8C00] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading ? "Отправка…" : "Оформить заказ"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
