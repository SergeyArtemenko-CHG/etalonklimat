"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderChar, setPlaceholderChar] = useState(0);
  const [placeholderPhase, setPlaceholderPhase] = useState<"typing" | "erasing">("typing");

  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const rate = useCurrencyStore((s) => s.rate);

  const placeholderPhrases = useMemo(() => {
    const names: string[] = [];
    for (const cat of categories) {
      if (cat.name) names.push(cat.name);
      if (Array.isArray(cat.subCategories)) {
        for (const sub of cat.subCategories) {
          if (sub?.name) names.push(sub.name);
        }
      }
    }
    return names.length ? names : ["горелки", "котлы", "аксессуары"];
  }, []);

  const trimmed = query.trim().toLowerCase();
  const showDropdown = trimmed.length >= 2;
  const results = showDropdown
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            p.sku.toLowerCase().includes(trimmed) ||
            (p.description?.toLowerCase().includes(trimmed) ?? false)
        )
        .sort((a, b) => {
          const asku = a.sku.toLowerCase();
          const bsku = b.sku.toLowerCase();
          const aStarts = asku.startsWith(trimmed) ? 0 : asku.includes(trimmed) ? 1 : 2;
          const bStarts = bsku.startsWith(trimmed) ? 0 : bsku.includes(trimmed) ? 1 : 2;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return 0;
        })
        .slice(0, 8)
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

  // Анимация подсказки в поиске: "Найти [категория/подкатегория]"
  useEffect(() => {
    if (!placeholderPhrases.length) return;

    const current = placeholderPhrases[placeholderIndex % placeholderPhrases.length];
    const typingSpeed = 80;
    const pause = 900;

    let timer: number;

    if (placeholderPhase === "typing") {
      if (placeholderChar < current.length) {
        timer = window.setTimeout(
          () => setPlaceholderChar((c) => c + 1),
          typingSpeed
        );
      } else {
        timer = window.setTimeout(
          () => setPlaceholderPhase("erasing"),
          pause
        );
      }
    } else {
      // erasing
      if (placeholderChar > 0) {
        timer = window.setTimeout(
          () => setPlaceholderChar((c) => c - 1),
          typingSpeed
        );
      } else {
        setPlaceholderPhase("typing");
        setPlaceholderIndex((i) => (i + 1) % placeholderPhrases.length);
      }
    }

    return () => window.clearTimeout(timer);
  }, [placeholderChar, placeholderPhase, placeholderPhrases, placeholderIndex]);

  const animatedPlaceholder =
    "Найти " +
    (placeholderPhrases.length
      ? placeholderPhrases[placeholderIndex % placeholderPhrases.length].slice(
          0,
          placeholderChar
        )
      : "");

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
          <nav className="flex items-center gap-3 sm:gap-4 text-white/80">
            <Link href="/about" className="hover:text-white hidden sm:block">О компании</Link>
            <Link href="/delivery" className="hover:text-white">Доставка</Link>
            <Link href="/contacts" className="hover:text-white">Контакты</Link>
            <a
              href="https://t.me/+74993980140"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0088cc] text-white transition hover:bg-[#0099e6]"
              aria-label="Telegram"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.098.155.229.171.322.016.094.036.308.02.475z" />
              </svg>
            </a>
            <a
              href="tel:+74993980140"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
              aria-label="Позвонить"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </nav>
        </div>
      </div>

      {/* Main header — фиксированная высота, чтобы не прыгал при скролле */}
      <div className="mx-auto max-w-6xl px-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-3 h-[72px] md:h-[88px] py-3 md:py-4">
          {/* Logo */}
          <div className="flex items-center justify-between md:w-auto md:min-w-[180px]">
            <Link href="/" className="flex items-center transition-transform active:scale-95">
              <img
                src="/images/Logo/ETALON_LOGO.png"
                alt="ETALON"
                className={`shrink-0 object-contain transition-all duration-300 ${
                  isShrunk ? "h-8 md:h-9" : "h-10 md:h-12"
                }`}
              />
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

            <div className="relative flex flex-1 items-center rounded-lg bg-white shadow-inner focus-within:ring-2 focus-within:ring-[#FF8C00]/50">
              {query.length === 0 && (
                <span className="pointer-events-none absolute left-3 text-sm text-slate-400 md:left-4">
                  {animatedPlaceholder}
                </span>
              )}
              <input
                type="text"
                value={query}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(e.target.value.trim().length >= 2);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results.length > 0) {
                    e.preventDefault();
                    router.push(`/product/${results[0].sku}`);
                    setOpen(false);
                  }
                }}
                className="h-10 w-full bg-transparent px-3 text-sm text-slate-900 focus:outline-none md:h-12 md:px-4"
              />
              
              {/* Dropdown Results */}
              {open && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                   {results.map(p => (
                     <Link key={p.sku} href={`/product/${p.sku}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="h-12 w-12 shrink-0 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Арт: {p.sku}</p>
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
