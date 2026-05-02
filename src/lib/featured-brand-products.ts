import type { FeaturedBrand } from "@/data/brands";

/**
 * Строка «Бренд» в номенклатуре может отличаться от названия в Brands.csv.
 * Ключ — slug страницы /brands/[slug].
 */
const EXTRA_PRODUCT_BRANDS_BY_SLUG: Record<string, readonly string[]> = {
  execo: ["ExEco"],
  /** В номенклатуре часто «Vanjord», в Brands.csv — «VANDJORD» / Vandjord */
  vandjord: ["Vanjord", "Vandjord", "VANJORD"],
};

function normBrand(s: string) {
  return s.trim().toLowerCase();
}

export function productBrandMatchesFeatured(
  productBrand: string | undefined,
  brand: FeaturedBrand
): boolean {
  const p = (productBrand ?? "").trim();
  if (!p) return false;
  const pNorm = normBrand(p);
  if (pNorm === normBrand(brand.name)) return true;
  const extra = EXTRA_PRODUCT_BRANDS_BY_SLUG[brand.slug];
  if (extra?.some((e) => normBrand(e) === pNorm)) return true;
  return false;
}
