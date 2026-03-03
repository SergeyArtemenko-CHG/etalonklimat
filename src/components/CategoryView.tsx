"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { useFilterStore } from "@/store/useFilterStore";
import type { Product } from "@/data/products";
import type { CategoryMatch } from "@/data/products";

type CategoryViewProps = {
  products: Product[];
  categoryMatch: CategoryMatch;
};

/**
 * Фильтрует товары по выбранным в Sidebar фильтрам:
 * - Вид топлива: товар должен соответствовать одному из выбранных fuelType
 * - Бренд: товар должен соответствовать одному из выбранных брендов
 * - Мощность: товар отображается только если (burnerPowerMin >= powerMin) && (burnerPowerMax <= powerMax)
 * - Тип котла, Материал теплообменника: для категории Котлы
 */
function applyFilters(
  products: Product[],
  fuelTypes: string[],
  brands: string[],
  powerMin: number | null,
  powerMax: number | null,
  boilerTypes: string[],
  heatExchangerMaterials: string[]
) {
  return products.filter((p) => {
    if (fuelTypes.length > 0 && (!p.fuelType?.trim() || !fuelTypes.includes(p.fuelType.trim()))) {
      return false;
    }
    if (brands.length > 0 && (!p.brand?.trim() || !brands.includes(p.brand.trim()))) {
      return false;
    }
    const pMin = p.burnerPowerMin;
    const pMax = p.burnerPowerMax;
    if (powerMin != null || powerMax != null) {
      if (pMin == null || pMax == null) return false;
      if (powerMin != null && pMin < powerMin) return false;
      if (powerMax != null && pMax > powerMax) return false;
    }
    if (boilerTypes.length > 0 && (!p.boilerType?.trim() || !boilerTypes.includes(p.boilerType.trim()))) {
      return false;
    }
    if (heatExchangerMaterials.length > 0 && (!p.heatExchangerMaterial?.trim() || !heatExchangerMaterials.includes(p.heatExchangerMaterial.trim()))) {
      return false;
    }
    return true;
  });
}

export default function CategoryView({ products, categoryMatch }: CategoryViewProps) {
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const brands = useFilterStore((s) => s.brands);
  const powerMin = useFilterStore((s) => s.powerMin);
  const powerMax = useFilterStore((s) => s.powerMax);
  const boilerTypes = useFilterStore((s) => s.boilerTypes);
  const heatExchangerMaterials = useFilterStore((s) => s.heatExchangerMaterials);

  const filteredProducts = useMemo(
    () =>
      applyFilters(
        products,
        fuelTypes,
        brands,
        powerMin,
        powerMax,
        boilerTypes,
        heatExchangerMaterials
      ),
    [
      products,
      fuelTypes,
      brands,
      powerMin,
      powerMax,
      boilerTypes,
      heatExchangerMaterials,
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
        <Sidebar products={products} filteredCount={filteredProducts.length} />
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
                <Sidebar products={products} filteredCount={filteredProducts.length} />
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
                {filteredProducts.map((product) => (
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
