"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { useFilterStore } from "@/store/useFilterStore";
import { applyCatalogFilters } from "@/lib/applyCatalogFilters";
import type { Product } from "@/data/products";

const PAGE_SIZE = 32;

type BrandPageCatalogProps = {
  slug: string;
  products: Product[];
  /** Строки поля «Бренд» из номенклатуры — совпадают с чекбоксами в Sidebar */
  presetBrandKeys: string[];
};

export default function BrandPageCatalog({
  slug,
  products,
  presetBrandKeys,
}: BrandPageCatalogProps) {
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const setBrands = useFilterStore((s) => s.setBrands);
  const inStockOnly = useFilterStore((s) => s.inStockOnly);
  const brands = useFilterStore((s) => s.brands);
  const numericRanges = useFilterStore((s) => s.numericRanges);
  const specTextFilters = useFilterStore((s) => s.specTextFilters);

  const presetKey = useMemo(
    () => [...presetBrandKeys].sort().join("\u001f"),
    [presetBrandKeys]
  );

  const prevRef = useRef<{ slug: string; presetKey: string } | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev && prev.slug === slug && prev.presetKey === presetKey) return;
    resetFilters();
    setBrands([...presetBrandKeys]);
    prevRef.current = { slug, presetKey };
    // presetBrandKeys стабилен при неизменном presetKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, presetKey]);

  const safeProducts = products ?? [];

  const filteredProducts = useMemo(
    () =>
      applyCatalogFilters(safeProducts, {
        inStockOnly,
        brands,
        numericRanges,
        specTextFilters,
      }),
    [safeProducts, inStockOnly, brands, numericRanges, specTextFilters]
  );

  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [inStockOnly, brands, numericRanges, specTextFilters, slug]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:gap-6">
      <div className="hidden md:block md:w-1/4 lg:w-[22%]">
        <ErrorBoundary>
          <Sidebar products={safeProducts} hideBrandFilter />
        </ErrorBoundary>
      </div>

      <div className="md:w-3/4 lg:w-[78%]">
        <div className="rounded-2xl bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-5">
          <div className="mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-text-muted/25 bg-text-muted/5 px-3 py-2 text-xs font-semibold text-primary shadow-sm hover:bg-text-muted/10"
            >
              <span>Фильтры</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                {filteredProducts.length}
              </span>
              <span
                className={`ml-1 text-[11px] ${
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
                  <Sidebar products={safeProducts} hideBrandFilter />
                </ErrorBoundary>
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    catalogLite
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
                    imagePriority={page === 1 && index === 0}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex flex-wrap items-center justify-center gap-2"
                  aria-label="Пагинация каталога"
                >
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-none border border-text-muted/25 px-3 py-1.5 text-sm text-text-main disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <span className="px-2 text-sm text-text-muted">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-none border border-text-muted/25 px-3 py-1.5 text-sm text-text-main disabled:opacity-40"
                  >
                    Вперёд
                  </button>
                </nav>
              )}
            </>
          ) : (
            <p className="text-text-muted">
              Нет товаров, соответствующих выбранным фильтрам.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
