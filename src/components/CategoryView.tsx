"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { useFilterStore } from "@/store/useFilterStore";
import {
  getBoilerPowerRange,
  getSteamOutputRange,
  getWorkingPressureRange,
} from "@/utils/specs";
import type { Product } from "@/data/products";
import type { CategoryMatch } from "@/data/products";

type CategoryViewProps = {
  products: Product[];
  categoryMatch: CategoryMatch;
};

function passBurnerPowerFilter(
  p: Product,
  powerMin: number | null,
  powerMax: number | null
): boolean {
  if (powerMin == null && powerMax == null) return true;
  const pMin = p.burnerPowerMin ?? p.burnerPowerMax;
  const pMax = p.burnerPowerMax ?? p.burnerPowerMin;
  if (pMin == null && pMax == null) return false;
  const lo = pMin ?? pMax!;
  const hi = pMax ?? pMin!;
  if (powerMin != null && hi < powerMin) return false;
  if (powerMax != null && lo > powerMax) return false;
  return true;
}

function passSpecRangeFilter(
  range: { min: number; max: number } | null,
  filterMin: number | null,
  filterMax: number | null
): boolean {
  if (filterMin == null && filterMax == null) return true;
  if (!range) return false;
  if (filterMin != null && range.max < filterMin) return false;
  if (filterMax != null && range.min > filterMax) return false;
  return true;
}

/**
 * Фильтрует товары в зависимости от категории:
 * - kotly-parovye: мощность котла, паропроизводительность, рабочее давление (из specs)
 * - kotly-vodogreinye: мощность котла, рабочее давление (из specs)
 * - остальные: диапазон мощности (burnerPowerMin/Max)
 */
function applyFilters(
  products: Product[],
  slug: string,
  store: {
    powerMin: number | null;
    powerMax: number | null;
    boilerPowerMin: number | null;
    boilerPowerMax: number | null;
    steamOutputMin: number | null;
    steamOutputMax: number | null;
    workingPressureMin: number | null;
    workingPressureMax: number | null;
  }
) {
  const noBurner =
    store.powerMin == null && store.powerMax == null;
  const noBoiler =
    store.boilerPowerMin == null && store.boilerPowerMax == null;
  const noSteam =
    store.steamOutputMin == null && store.steamOutputMax == null;
  const noPressure =
    store.workingPressureMin == null && store.workingPressureMax == null;

  const safeProducts = products ?? [];

  if (slug === "kotly-parovye" && noBoiler && noSteam && noPressure)
    return safeProducts;
  if (slug === "kotly-vodogreinye" && noBoiler && noPressure)
    return safeProducts;
  if (noBurner && slug !== "kotly-parovye" && slug !== "kotly-vodogreinye")
    return safeProducts;

  return safeProducts.filter((p) => {
    if (slug === "kotly-parovye") {
      const bp = getBoilerPowerRange(p);
      const so = getSteamOutputRange(p);
      const wp = getWorkingPressureRange(p);
      if (
        !passSpecRangeFilter(bp, store.boilerPowerMin, store.boilerPowerMax)
      )
        return false;
      if (
        !passSpecRangeFilter(so, store.steamOutputMin, store.steamOutputMax)
      )
        return false;
      if (
        !passSpecRangeFilter(wp, store.workingPressureMin, store.workingPressureMax)
      )
        return false;
      return true;
    }
    if (slug === "kotly-vodogreinye") {
      const bp = getBoilerPowerRange(p);
      const wp = getWorkingPressureRange(p);
      if (
        !passSpecRangeFilter(bp, store.boilerPowerMin, store.boilerPowerMax)
      )
        return false;
      if (
        !passSpecRangeFilter(wp, store.workingPressureMin, store.workingPressureMax)
      )
        return false;
      return true;
    }
    return passBurnerPowerFilter(p, store.powerMin, store.powerMax);
  });
}

/** Сброс фильтров при смене категории (один раз на каждый slug) */
function useResetFiltersOnSlugChange(slug: string) {
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const prevSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (slug == null || slug === "") return;
    if (prevSlugRef.current === slug) return;
    resetFilters();
    prevSlugRef.current = slug;
  }, [slug]);
}

export default function CategoryView({ products, categoryMatch }: CategoryViewProps) {
  const slug = categoryMatch?.slug ?? "";
  useResetFiltersOnSlugChange(slug);

  const powerMin = useFilterStore((s) => s.powerMin);
  const powerMax = useFilterStore((s) => s.powerMax);
  const boilerPowerMin = useFilterStore((s) => s.boilerPowerMin);
  const boilerPowerMax = useFilterStore((s) => s.boilerPowerMax);
  const steamOutputMin = useFilterStore((s) => s.steamOutputMin);
  const steamOutputMax = useFilterStore((s) => s.steamOutputMax);
  const workingPressureMin = useFilterStore((s) => s.workingPressureMin);
  const workingPressureMax = useFilterStore((s) => s.workingPressureMax);

  const filteredProducts = useMemo(
    () =>
      applyFilters(products ?? [], slug, {
        powerMin,
        powerMax,
        boilerPowerMin,
        boilerPowerMax,
        steamOutputMin,
        steamOutputMax,
        workingPressureMin,
        workingPressureMax,
      }),
    [
      products,
      slug,
      powerMin,
      powerMax,
      boilerPowerMin,
      boilerPowerMax,
      steamOutputMin,
      steamOutputMax,
      workingPressureMin,
      workingPressureMax,
    ]
  );

  const productsRef = useRef<HTMLDivElement | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    if (!productsRef.current) return;

    const rect = productsRef.current.getBoundingClientRect();
    const offset = 80;
    const top = rect.top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <section className="flex w-full max-w-6xl flex-col gap-4 md:flex-row md:gap-6">
      {/* Desktop sidebar with filters */}
      <div className="hidden md:block md:w-1/4 lg:w-[22%]">
        <ErrorBoundary>
          <Sidebar
            products={products}
            filteredCount={filteredProducts?.length ?? 0}
            categorySlug={slug}
          />
        </ErrorBoundary>
      </div>

      {/* Main content */}
      <div className="md:w-3/4 lg:w-[78%]">
        <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 transition-shadow hover:shadow-lg md:p-5">
          {/* Mobile filters toggle — вверху, перед хлебными крошками */}
          <div className="mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#003366] shadow-sm transition hover:bg-slate-100"
            >
              <span>Фильтры</span>
              <span className="rounded-full bg-[#FF8C00]/10 px-2 py-0.5 text-[11px] font-medium text-[#FF8C00]">
                {filteredProducts.length}
              </span>
              <span
                className={`ml-1 text-[11px] transition-transform ${
                  mobileFiltersOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
            {mobileFiltersOpen && (
              <div className="mt-3">
                <ErrorBoundary>
                  <Sidebar
                    products={products}
                    filteredCount={filteredProducts?.length ?? 0}
                    categorySlug={slug}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>

          <nav className="mb-4 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#003366]">
              Главная
            </Link>
            <span className="mx-2">/</span>
            {"parentName" in categoryMatch ? (
              <>
                <Link
                  href={`/category/${categoryMatch.parentSlug}`}
                  className="hover:text-[#003366]"
                >
                  {categoryMatch.parentName}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-[#0b1f33]">{categoryMatch.name}</span>
              </>
            ) : (
              <span className="text-[#0b1f33]">{categoryMatch.name}</span>
            )}
          </nav>

          <h1 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
            {categoryMatch.name}
          </h1>

          <div ref={productsRef}>
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(filteredProducts ?? []).map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    sku={product.sku}
                    priceEur={product.priceEur}
                    priceRub={product.priceRub}
                    image={product.image}
                    burnerPowerMin={product.burnerPowerMin}
                    burnerPowerMax={product.burnerPowerMax}
                    inStock={product.inStock}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-500">
                В этой категории нет товаров, соответствующих выбранным фильтрам.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
