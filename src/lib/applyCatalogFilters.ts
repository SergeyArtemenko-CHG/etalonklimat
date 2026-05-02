import {
  buildDynamicSpecFilters,
  getRangeValue,
  getTextValue,
} from "@/config/specFilterBuilder";
import { specFieldMeta, specFieldOrder } from "@/data/products";
import type { Product } from "@/data/products";

export type CatalogFilterState = {
  inStockOnly: boolean;
  brands: string[];
  numericRanges: Record<string, { min: number | null; max: number | null }>;
  specTextFilters: Record<string, string[]>;
};

export function applyCatalogFilters(
  products: Product[],
  store: CatalogFilterState
): Product[] {
  const safeProducts = products ?? [];
  let result = safeProducts;

  if (store.inStockOnly) {
    result = result.filter((p) => p.inStock !== false);
  }

  if (store.brands.length > 0) {
    const selected = new Set(store.brands);
    result = result.filter((p) => selected.has((p.brand || "").trim()));
  }

  const dynamicDefs = buildDynamicSpecFilters(
    result,
    specFieldMeta,
    specFieldOrder
  );
  if (dynamicDefs.length === 0) return result;

  result = result.filter((p) => {
    for (const def of dynamicDefs) {
      if (def.type === "text") {
        const selected = store.specTextFilters[def.id] ?? [];
        if (selected.length === 0) continue;
        const value = getTextValue(p, def);
        if (!value) continue;
        if (!selected.includes(value)) return false;
        continue;
      }

      const selected = store.numericRanges[def.id];
      const selectedMin = selected?.min ?? null;
      const selectedMax = selected?.max ?? null;
      if (selectedMin == null && selectedMax == null) continue;
      const value = getRangeValue(p, def);
      if (!value) continue;
      if (selectedMin != null && value.max < selectedMin) return false;
      if (selectedMax != null && value.min > selectedMax) return false;
    }
    return true;
  });

  return result;
}
