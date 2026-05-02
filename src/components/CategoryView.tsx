"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { useFilterStore } from "@/store/useFilterStore";
import type { Product } from "@/data/products";
import type { CategoryMatch } from "@/data/products";
import { applyCatalogFilters } from "@/lib/applyCatalogFilters";

type CategoryViewProps = {
  products: Product[];
  categoryMatch: CategoryMatch;
};

function useResetFiltersOnSlugChange(slug: string) {
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const prevSlugRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Если категория пустая (например, на главной) — выходим
    if (!slug) return;

    // 2. Если категория та же самая — выходим (защита от цикла #310)
    if (prevSlugRef.current === slug) return;

    // 3. Если категория новая — сбрасываем фильтры
    resetFilters();
    
    // 4. Запоминаем текущую категорию
    prevSlugRef.current = slug;
  }, [slug, resetFilters]);
}

export default function CategoryView({ products, categoryMatch }: CategoryViewProps) {
  const slug = categoryMatch?.slug ?? "";
  useResetFiltersOnSlugChange(slug);

  const inStockOnly = useFilterStore((s) => s.inStockOnly);
  const brands = useFilterStore((s) => s.brands);
  const numericRanges = useFilterStore((s) => s.numericRanges);
  const specTextFilters = useFilterStore((s) => s.specTextFilters);

  const safeProducts = products ?? [];

  const filteredProducts = useMemo(
    () =>
      applyCatalogFilters(safeProducts, {
        inStockOnly,
        brands,
        numericRanges,
        specTextFilters,
      }),
    [
      safeProducts,
      inStockOnly,
      brands,
      numericRanges,
      specTextFilters,
    ]
  );

  const shouldShowFilters = safeProducts.length > 0;

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
      {shouldShowFilters && (
        <div className="hidden md:block md:w-1/4 lg:w-[22%]">
          <ErrorBoundary>
            <Sidebar
              products={products}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Main content */}
      <div className={shouldShowFilters ? "md:w-3/4 lg:w-[78%]" : "md:w-full lg:w-full"}>
        <div className="rounded-2xl bg-card-bg p-4 shadow-md shadow-text-muted/8 transition-shadow hover:shadow-lg md:p-5">
          {/* Mobile filters toggle — вверху, перед хлебными крошками */}
          {shouldShowFilters && (
            <div className="mb-4 md:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-text-muted/25 bg-text-muted/5 px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-text-muted/10"
              >
                <span>Фильтры</span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
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
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          )}

          <nav className="mb-4 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <span className="mx-2">/</span>
            {"parentName" in categoryMatch ? (
              <>
                <Link
                  href={`/category/${categoryMatch.parentSlug}`}
                  className="hover:text-primary"
                >
                  {categoryMatch.parentName}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-primary">{categoryMatch.name}</span>
              </>
            ) : (
              <span className="text-primary">{categoryMatch.name}</span>
            )}
          </nav>

          <h1 className="mb-4 text-lg font-semibold text-primary md:text-xl">
            {categoryMatch.name}
          </h1>

          <div ref={productsRef}>
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(filteredProducts ?? []).map((product, index) => (
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
                    partnerDiscount1={product.partnerDiscount1}
                    partnerDiscount2={product.partnerDiscount2}
                    partnerDiscount3={product.partnerDiscount3}
                    leadTime={product.leadTime}
                    imagePriority={index === 0}
                  />
                ))}
              </div>
            ) : (
              <p className="text-text-muted">
                В этой категории нет товаров, соответствующих выбранным фильтрам.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
