"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { products } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";

function ProductImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded border border-dashed border-slate-300 bg-slate-100 ${className || ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 text-slate-400"
      >
        <rect x="3" y="6" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 14h18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="10" r="1.2" fill="currentColor" />
        <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalItems = useCartStore((s) => s.getTotalItems());
  const rate = useCurrencyStore((s) => s.rate);

  const trimmed = query.trim();
  const showDropdown = trimmed.length >= 2;
  const results = showDropdown
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            p.sku.toLowerCase().includes(trimmed.toLowerCase()) ||
            (p.description?.toLowerCase().includes(trimmed.toLowerCase()) ?? false)
        )
        .slice(0, 6)
    : [];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#003366] text-white shadow-md">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#02274d]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Ваш город:</span>
            <button className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-medium hover:border-white hover:bg-white/10">
              Москва
            </button>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-white/80">
            <a href="#" className="hover:text-white">
              О компании
            </a>
            <a href="#" className="hover:text-white">
              Доставка
            </a>
            <a href="#" className="hover:text-white">
              Контакты
            </a>
          </nav>
        </div>
      </div>

      {/* Main header */}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:gap-6 md:py-5">
        {/* Logo */}
        <div className="flex items-center md:w-[200px]">
          <Link href="/" className="flex items-center gap-3 transition opacity-90 hover:opacity-100">
            <svg
              viewBox="0 0 48 48"
              className="h-10 w-10 shrink-0"
              aria-hidden="true"
            >
              <rect width="48" height="48" rx="8" fill="white" />
              <g fill="none" stroke="#003366" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14h20M14 24h16M14 34h12" />
                <path d="M14 14v20" strokeWidth="3.5" />
              </g>
            </svg>
            <span className="text-xl font-bold tracking-[0.2em] text-white">
              ETALON
            </span>
          </Link>
        </div>

        {/* Catalog + search */}
        <div
          ref={containerRef}
          className="relative flex w-full flex-col gap-3 md:flex-1 md:flex-row md:items-center"
        >
          <button className="flex items-center justify-center rounded-xl bg-[#FF8C00] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg md:w-[140px]">
            Каталог
          </button>
          <div className="relative flex flex-1 items-center rounded-md bg-white px-3 py-2 shadow-sm">
            <input
              type="text"
              placeholder="Поиск по товарам"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setOpen(v.trim().length >= 2);
              }}
              onFocus={() => showDropdown && setOpen(true)}
              className="w-full border-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            {open && showDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                {results.length > 0 ? results.map((p) => (
                  <Link
                    key={p.sku}
                    href={`/product/${p.sku}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                  >
                    <ProductImagePlaceholder className="h-12 w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#003366]">
                      {formatPrice(p.priceEur, p.priceRub, rate)}
                    </span>
                  </Link>
                )) : (
                  <p className="px-3 py-4 text-center text-sm text-slate-500">
                    Ничего не найдено
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Phone / Cart */}
        <div className="flex flex-col items-start gap-1 md:w-[210px] md:items-end">
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-xl border-2 border-[#FF8C00] px-4 py-1.5 font-medium text-[#FF8C00] transition hover:bg-[#FF8C00] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="text-xs font-semibold">Корзина</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF8C00] px-1.5 text-xs font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          </div>
          <a
            href="tel:+78000000000"
            className="text-sm font-semibold tracking-wide text-white"
          >
            8 800 000-00-00
          </a>
          <span className="text-xs text-white/70">Звонок по России бесплатный</span>
          <button className="mt-1 rounded-xl border-2 border-[#FF8C00] px-4 py-1.5 text-xs font-semibold text-[#FF8C00] transition hover:bg-[#FF8C00] hover:text-white">
            Заказать звонок
          </button>
        </div>
      </div>
    </header>
  );
}
