"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { products, categories } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";

// ... (ProductImagePlaceholder остается без изменений)

export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const [isShrunk, setIsShrunk] = useState(false);

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
    const target = e.target as Node;
    const insideHeader = containerRef.current?.contains(target);
    const insideCatalog = catalogRef.current?.contains(target);
    if (insideHeader || insideCatalog) return;
    setOpen(false);
    setCatalogOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsShrunk((prev) => (y > 80 ? true : y < 40 ? false : prev));
        ticking = false;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 w-full bg-[#003366] text-white shadow-lg z-[100]">
      {/* Top bar — скрываем при скролле, фиксированная высота в развёрнутом виде */}
      <div
        className={`border-b border-white/10 bg-[#02274d] overflow-hidden transition-[max-height] duration-300 ease-out ${
          isShrunk ? "max-h-0" : "max-h-[52px]"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Ваш город:</span>
            <button className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-medium hover:border-white hover:bg-white/10">
              Москва
            </button>
          </div>
          <nav className="flex items-center gap-4 text-white/80">
            <Link href="/about" className="hover:text-white hidden sm:block">О компании</Link>
            <Link href="/delivery" className="hover:text-white">Доставка</Link>
            <Link href="/contacts" className="hover:text-white">Контакты</Link>
          </nav>
        </div>
      </div>

      {/* Main header — фиксированная высота, чтобы не прыгал при скролле */}
      <div className="mx-auto max-w-6xl px-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-3 h-[72px] md:h-[88px] py-3 md:py-4">
          {/* Logo */}
          <div className="flex items-center justify-between md:w-auto md:min-w-[180px]">
            <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
              <svg
                viewBox="0 0 48 48"
                className={`${isShrunk ? "h-7 w-7 md:h-8 md:w-8" : "h-9 w-9 md:h-10 md:w-10"} shrink-0 transition-all duration-300`}
              >
                <rect width="48" height="48" rx="8" fill="white" />
                <g fill="none" stroke="#003366" strokeWidth="3">
                  <path d="M14 14h20M14 24h16M14 34h12" />
                  <path d="M14 14v20" strokeWidth="3.5" />
                </g>
              </svg>
              <span className={`font-bold tracking-wider text-white transition-all duration-300 ${
                isShrunk ? "text-lg" : "text-xl md:text-2xl"
              }`}>
                ETALON
              </span>
            </Link>
            
            {/* Мобильная кнопка корзины (появляется только в мобильном ряду логотипа) */}
            <Link href="/cart" className="relative p-2 md:hidden">
                <span className="text-xl">🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF8C00] text-[10px] font-bold">
                    {totalItems}
                  </span>
                )}
            </Link>
          </div>

          {/* Catalog + Search */}
          <div ref={containerRef} className="flex flex-1 items-center gap-2 md:gap-4 h-full">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className="group flex h-10 items-center gap-2 rounded-lg bg-[#FF8C00] px-3 text-sm font-bold text-white transition-all hover:bg-[#ff9f26] active:scale-95 md:h-12 md:px-6"
            >
              <div className="flex flex-col gap-1">
                <span className={`h-0.5 w-4 bg-white transition-all ${catalogOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 w-4 bg-white ${catalogOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-4 bg-white transition-all ${catalogOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
              <span className="hidden md:block">Каталог</span>
            </button>

            <div className="relative flex flex-1 items-center overflow-hidden rounded-lg bg-white shadow-inner focus-within:ring-2 focus-within:ring-[#FF8C00]/50">
              <input
                type="text"
                placeholder="Поиск по артикулу или названию..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(e.target.value.trim().length >= 2); }}
                className="h-10 w-full px-3 text-sm text-slate-900 focus:outline-none md:h-12 md:px-4"
              />
              
              {/* Dropdown Results */}
              {open && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                   {results.map(p => (
                     <Link key={p.sku} href={`/product/${p.sku}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="h-12 w-12 shrink-0 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">Арт: {p.sku}</p>
                        </div>
                     </Link>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Cart */}
          <Link href="/cart" className="hidden md:flex items-center gap-3 rounded-xl bg-white/10 p-2 pl-4 transition hover:bg-white/20">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/60">Корзина</p>
              <p className="text-sm font-bold">{totalItems} тов.</p>
            </div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8C00]">
              <span className="text-xl">🛒</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Catalog Overlay */}
      {catalogOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setCatalogOpen(false)}
            aria-hidden
          />
          <div
            ref={catalogRef}
            className="absolute left-0 top-full w-full border-t border-white/10 bg-[#003366] p-6 shadow-2xl z-50"
          >
            <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => {
                    setCatalogOpen(false);
                    setQuery("");
                  }}
                  className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-[#FF8C00] group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-medium text-white">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
