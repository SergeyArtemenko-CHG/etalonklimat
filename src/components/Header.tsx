"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { products, categories } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";
import TopAuthBar from "@/components/TopAuthBar";
import { useStickyGuard } from "@/hooks/useStickyGuard";
import {
  getProductHref,
  productImageAlt,
  resolveProductImageSrc,
} from "@/lib/product-url";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M6 7h14l-1.2 7.2a1 1 0 01-1 .8H8.2a1 1 0 01-1-.8L6 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 7L3.5 4H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 19.5a1 1 0 102 0 1 1 0 00-2 0zM16 19.5a1 1 0 102 0 1 1 0 00-2 0z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SearchProductThumb({ src, alt, sku }: { src?: string; alt: string; sku: string }) {
  const [failed, setFailed] = useState(false);
  const usePlaceholder = !src?.trim() || failed;
  const imageSrc = resolveProductImageSrc(src, sku, usePlaceholder);
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-text-muted/25 bg-main-bg">
      <Image
        src={imageSrc}
        alt={productImageAlt(alt)}
        width={48}
        height={48}
        sizes="48px"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityName, setCityName] = useState("Москва");
  const [cityInput, setCityInput] = useState("");
  const [cityLoaded, setCityLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const headerElRef = useRef<HTMLElement | null>(null);
  const { ref: stickyGuardRef, isSticky } = useStickyGuard({
    thresholdRatio: 0.4,
    applyGuardOnlyOnCompactViewport: true,
    compactMaxWidth: 768,
    compactMaxHeight: 700,
  });
  const [isShrunk, setIsShrunk] = useState(false);
  const [spacerPx, setSpacerPx] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const setHeaderRef = useCallback(
    (node: HTMLElement | null) => {
      headerElRef.current = node;
      stickyGuardRef.current = node;
    },
    [stickyGuardRef],
  );

  /** Высота спейсера = развёрнутая шапка; при сжатии не уменьшаем — нет тряски. */
  useLayoutEffect(() => {
    const el = headerElRef.current;
    if (!el || isShrunk) return;
    const h = Math.round(el.getBoundingClientRect().height);
    if (h > 0) setSpacerPx((prev) => Math.max(prev, h));
  }, [isShrunk, isSticky, cityLoaded]);

  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const rate = useCurrencyStore((s) => s.rate);

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (trimmed.length < 2) return [];
    return products
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
      .slice(0, 8);
  }, [trimmed]);
  const showDropdown = trimmed.length >= 2;

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
    setIsClient(true);
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const pickCity = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";
    const normalize = (s: string) => s.trim().toLowerCase();
    const cityRuMap: Record<string, string> = {
      chernogolovka: "Черноголовка",
      moscow: "Москва",
      "saint petersburg": "Санкт-Петербург",
      "st petersburg": "Санкт-Петербург",
      petersburg: "Санкт-Петербург",
      kazan: "Казань",
      yekaterinburg: "Екатеринбург",
      ekaterinburg: "Екатеринбург",
      novosibirsk: "Новосибирск",
      "nizhny novgorod": "Нижний Новгород",
      samara: "Самара",
      ufa: "Уфа",
      krasnodar: "Краснодар",
      voronezh: "Воронеж",
      perm: "Пермь",
      omsk: "Омск",
      chelyabinsk: "Челябинск",
      "rostov-on-don": "Ростов-на-Дону",
      "rostov on don": "Ростов-на-Дону",
    };
    const localizeCity = (city: string) => {
      const raw = city.trim();
      if (!raw) return raw;
      const mapped = cityRuMap[normalize(raw)];
      return mapped || raw;
    };

    const detectCity = async () => {
      try {
        let detected = "";

        // 1) Основной источник (HTTPS, работает в браузере без mixed-content)
        const ipInfoRes = await fetch("https://ipinfo.io/json", { cache: "no-store" });
        if (ipInfoRes.ok) {
          const ipInfo = (await ipInfoRes.json()) as { city?: string };
          detected = pickCity(ipInfo.city);
        }

        // 2) Фолбэк на ip-api (если основной источник не вернул город)
        if (!detected) {
          const ipApiRes = await fetch("http://ip-api.com/json/?fields=status,city", {
            cache: "no-store",
          });
          if (ipApiRes.ok) {
            const ipApi = (await ipApiRes.json()) as { status?: string; city?: string };
            detected = pickCity(ipApi.city);
          }
        }

        if (!detected) return;
        if (cancelled) return;
        const detectedRu = localizeCity(detected);
        if (normalize(detectedRu) !== "москва") {
          setCityName(detectedRu);
        }
      } catch {
        // Безопасный фолбэк: оставляем Москву
      } finally {
        if (!cancelled) setCityLoaded(true);
      }
    };

    const runAfterFullLoad = () => {
      // Запускаем только в idle-фазе после полной загрузки страницы,
      // чтобы определение города не влияло на рендер и метрики загрузки.
      const idle = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      if (typeof idle === "function") {
        idle(() => void detectCity(), { timeout: 2000 });
      } else {
        setTimeout(() => void detectCity(), 0);
      }
    };

    if (document.readyState === "complete") {
      runAfterFullLoad();
    } else {
      window.addEventListener("load", runAfterFullLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", runAfterFullLoad);
    };
  }, []);

  return (
    <>
      {isSticky && spacerPx > 0 ? (
        <div style={{ height: spacerPx }} aria-hidden className="w-full shrink-0" />
      ) : null}
      <header
        ref={setHeaderRef}
        className={`w-full bg-[#16566f] text-white shadow-lg ${
          isSticky && spacerPx > 0
            ? "fixed inset-x-0 top-0 z-[200]"
            : "relative z-[200]"
        }`}
      >
      {/* Top bar — всегда видима */}
      <div className="border-b border-white/10 bg-[#0e2e39]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/80">Ваш город:</span>
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              aria-label={`Выбрать город. Текущий: ${cityName}`}
              className={`rounded-full border border-white/30 px-2 py-0.5 text-xs font-medium hover:border-white hover:bg-white/10 transition-all duration-300 ${
                cityLoaded ? "opacity-100" : "opacity-95"
              }`}
            >
              <span className="underline decoration-white/40 underline-offset-2">
                {cityName}
              </span>
            </button>
            <span className="hidden text-white/80 lg:inline">
              Доставка по всей России
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-3 sm:gap-4 text-white/80" aria-label="Верхнее меню">
              <Link href="/about" className="hover:text-white hidden sm:block">О компании</Link>
              <Link href="/delivery" className="hover:text-white">Доставка</Link>
              <Link href="/contacts" className="hover:text-white">Контакты</Link>
              <Link href="/login" className="hover:text-white">Личный кабинет</Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main header — при скролле сжимается; spacer снаружи держит поток */}
      <div
        className={`header-main-row flex w-full flex-col md:flex-row md:items-stretch ${
          isShrunk ? "is-shrunk" : ""
        }`}
      >
        <div className="header-logo-strip flex shrink-0 items-center justify-between self-stretch border-l border-white/45 pl-6 pr-4 md:pl-8 md:pr-5">
          <Link
            href="/"
            aria-label="ETALON — перейти на главную"
            className="header-logo-slot transition-transform duration-300 ease-out active:scale-95"
          >
            <img
              src="/images/Logo/Etalon_LOGO.svg"
              alt="ETALON"
              className="header-logo-img h-auto shrink-0 object-contain object-left"
            />
          </Link>

          <Link
            href="/cart"
            aria-label={`Корзина${totalItems > 0 ? `, товаров: ${totalItems}` : ""}`}
            className="relative p-2 md:hidden"
          >
            <CartIcon className="h-6 w-6 text-white" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        <div className="header-main-inner mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-3 px-4 md:flex-row md:items-center">
          {/* Catalog + Search */}
          <div ref={containerRef} className="flex h-full flex-1 items-center gap-2 md:gap-4">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              aria-label={catalogOpen ? "Закрыть каталог" : "Открыть каталог"}
              aria-expanded={catalogOpen}
              className="header-ctrl group flex shrink-0 items-center gap-2 rounded-none border border-white bg-[#16566f] px-3 text-sm font-bold text-white transition-[background-color,height] duration-300 ease-out hover:bg-[#124a5f] active:scale-[0.98] md:px-6"
            >
              <div className="flex flex-col gap-1">
                <span className={`h-0.5 w-4 bg-white transition-all ${catalogOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 w-4 bg-white ${catalogOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-4 bg-white transition-all ${catalogOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
              <span className="hidden md:block">Каталог</span>
            </button>

            <div className="relative flex flex-1 items-center rounded-none bg-card-bg shadow-inner focus-within:ring-2 focus-within:ring-white/40">
              <label htmlFor="header-search" className="sr-only">
                Поиск по артикулу или названию товара
              </label>
              {isClient && query.length === 0 && (
                <span className="pointer-events-none absolute left-3 z-10 text-sm text-text-muted md:left-4">
                  Поиск по артикулу или названию...
                </span>
              )}
              <input
                id="header-search"
                type="text"
                value={query}
                aria-autocomplete="list"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(e.target.value.trim().length >= 2);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results.length > 0) {
                    e.preventDefault();
                    router.push(getProductHref(results[0]));
                    setOpen(false);
                  }
                }}
                className="header-ctrl w-full bg-transparent px-3 text-sm text-text-main focus:outline-none md:px-4"
              />
              
              {/* Dropdown Results */}
              {open && results.length > 0 && (
                <div id="search-results" className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-text-muted/25 bg-card-bg p-2 shadow-2xl">
                   {results.map((p) => (
                     <Link
                       key={p.sku}
                       href={getProductHref(p)}
                       onClick={() => setOpen(false)}
                       className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-main-bg"
                     >
                       <SearchProductThumb src={p.image} alt={p.name} sku={p.sku} />
                       <div className="min-w-0 flex-1">
                         <p className="truncate text-sm font-medium text-text-main">{p.name}</p>
                         <p className="text-[10px] uppercase tracking-tight text-text-muted">Арт: {p.sku}</p>
                       </div>
                     </Link>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Cart */}
          <Link
            href="/cart"
            aria-label={`Корзина${totalItems > 0 ? `, товаров: ${totalItems}` : ""}`}
            className="header-ctrl hidden shrink-0 items-center gap-3 rounded-none border border-white bg-[#16566f] px-4 transition-[background-color,height] duration-300 ease-out hover:bg-[#124a5f] md:flex md:pl-5 md:pr-4"
          >
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/80">Корзина</p>
              <p className="text-sm font-bold text-white">{totalItems} тов.</p>
            </div>
            <CartIcon className="h-6 w-6 shrink-0 text-white" />
          </Link>
        </div>
      </div>

      {/* Панель авторизации под хедером */}
      <TopAuthBar />

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
            className="absolute left-0 top-full z-50 w-full border-t border-text-muted/15 bg-card-bg px-6 py-8 shadow-2xl md:py-9"
          >
            <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-10 gap-y-5 md:grid-cols-4 md:gap-x-12 md:gap-y-6">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => {
                    setCatalogOpen(false);
                    setQuery("");
                  }}
                  className="catalog-category-link w-fit text-sm font-medium"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {cityModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[120] bg-black/40"
            onClick={() => setCityModalOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-card-bg p-5 shadow-2xl">
              <h3 className="text-base font-semibold text-text-main">
                Выбор города
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Текущий город: <span className="font-medium">{cityName}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск"].map(
                  (city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setCityName(city);
                        setCityModalOpen(false);
                      }}
                      className="rounded-full border border-text-muted/35 px-3 py-1 text-xs font-medium text-text-main hover:border-accent hover:text-accent"
                    >
                      {city}
                    </button>
                  )
                )}
              </div>
              <div className="mt-4">
                <label htmlFor="city-input" className="sr-only">
                  Введите ваш город
                </label>
                <input
                  id="city-input"
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Или введите ваш город"
                  className="w-full rounded-lg border border-text-muted/35 px-3 py-2 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  aria-label="Отменить выбор города"
                  className="rounded-lg border border-text-muted/35 px-3 py-2 text-sm text-text-main hover:bg-main-bg"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const manual = cityInput.trim();
                    if (manual) {
                      setCityName(manual);
                    }
                    setCityModalOpen(false);
                  }}
                  aria-label="Подтвердить выбор города"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
    </>
  );
}
