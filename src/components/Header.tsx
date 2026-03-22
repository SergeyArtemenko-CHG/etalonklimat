"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { products, categories } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";
import TopAuthBar from "@/components/TopAuthBar";
import { useStickyGuard } from "@/hooks/useStickyGuard";

function SearchProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = src?.trim() && !failed;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {showImg ? (
        <Image
          src={src!.trim()}
          alt={alt}
          width={48}
          height={48}
          sizes="48px"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-500" aria-hidden>
          <rect x="3" y="6" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 14h18" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
          <circle cx="15" cy="10" r="1.2" fill="currentColor" />
        </svg>
      )}
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
  const { ref: headerStickyRef, isSticky } = useStickyGuard({
    thresholdRatio: 0.4,
    applyGuardOnlyOnCompactViewport: true,
    compactMaxWidth: 768,
    compactMaxHeight: 700,
  });
  const [isShrunk, setIsShrunk] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const rate = useCurrencyStore((s) => s.rate);

  console.log("Categories for animation:", categories?.length);

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
    <header
      ref={headerStickyRef}
      className={`w-full bg-[#003366] text-white shadow-lg transition-all duration-300 ease-out ${
        isSticky ? "sticky top-0 z-[100]" : "relative z-[100]"
      }`}
    >
      {/* Top bar — скрываем при скролле, фиксированная высота в развёрнутом виде */}
      <div
        className={`border-b border-white/10 bg-[#02274d] overflow-hidden transition-[max-height] duration-300 ease-out ${
          isShrunk ? "max-h-0" : "max-h-[52px]"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:text-sm">
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
            <span className="hidden text-[10px] text-white/80 lg:inline">
              Доставка по всей России
            </span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4 text-white/80" aria-label="Верхнее меню">
            <Link href="/about" className="hover:text-white hidden sm:block">О компании</Link>
            <Link href="/delivery" className="hover:text-white">Доставка</Link>
            <Link href="/contacts" className="hover:text-white">Контакты</Link>
          </nav>
        </div>
      </div>

      {/* Main header — фиксированная высота, чтобы не прыгал при скролле */}
      <div className="mx-auto max-w-6xl px-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-3 min-h-[72px] md:min-h-[88px] py-3 md:py-4">
          {/* Logo */}
          <div className="mr-4 flex items-center justify-between max-md:pl-3 md:min-w-0 md:mr-6 md:-ml-5">
            <Link href="/" aria-label="ETALON — перейти на главную" className="flex items-center transition-transform active:scale-95">
              <img
                src="/images/Logo/Etalon_LOGO.svg"
                alt="ETALON"
                className="h-auto w-24 shrink-0 object-contain object-left md:w-36"
              />
            </Link>
            
            {/* Мобильная кнопка корзины (появляется только в мобильном ряду логотипа) */}
            <Link href="/cart" aria-label={`Корзина${totalItems > 0 ? `, товаров: ${totalItems}` : ""}`} className="relative p-2 md:hidden">
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
              aria-label={catalogOpen ? "Закрыть каталог" : "Открыть каталог"}
              aria-expanded={catalogOpen}
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
              <label htmlFor="header-search" className="sr-only">
                Поиск по артикулу или названию товара
              </label>
              {isClient && query.length === 0 && (
                <span className="pointer-events-none absolute left-3 z-10 text-sm text-slate-600 md:left-4">
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
                    router.push(`/product/${results[0].sku}`);
                    setOpen(false);
                  }
                }}
                className="h-10 w-full bg-transparent px-3 text-sm text-slate-900 focus:outline-none md:h-12 md:px-4"
              />
              
              {/* Dropdown Results */}
              {open && results.length > 0 && (
                <div id="search-results" className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                   {results.map((p) => (
                     <Link
                       key={p.sku}
                       href={`/product/${p.sku}`}
                       onClick={() => setOpen(false)}
                       className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                     >
                       <SearchProductThumb src={p.image} alt={p.name} />
                       <div className="min-w-0 flex-1">
                         <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                         <p className="text-[10px] uppercase tracking-tight text-slate-600">Арт: {p.sku}</p>
                       </div>
                     </Link>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Cart */}
          <Link href="/cart" aria-label={`Корзина${totalItems > 0 ? `, товаров: ${totalItems}` : ""}`} className="hidden md:flex items-center gap-3 rounded-xl bg-white/10 p-2 pl-4 transition hover:bg-white/20">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/80">Корзина</p>
              <p className="text-sm font-bold">{totalItems} тов.</p>
            </div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8C00]">
              <span className="text-xl">🛒</span>
            </div>
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

      {cityModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[120] bg-black/40"
            onClick={() => setCityModalOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-900">
                Выбор города
              </h3>
              <p className="mt-1 text-sm text-slate-600">
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
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-[#FF8C00] hover:text-[#FF8C00]"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  aria-label="Отменить выбор города"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
                  className="rounded-lg bg-[#FF8C00] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ff9f26]"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
