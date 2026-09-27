/**
 * Каталог серий горелок FBR (склейка модификаций).
 * Данные: src/data/burners_catalog_tree.json
 * Генерация: python scripts/build_burners_catalog_tree.py
 */

import treeJson from "@/data/burners_catalog_tree.json";

export type BurnerModel = {
  sku: string;
  name: string;
  productSlug: string;
  priceRub: number | null;
  priceEur: number | null;
  powerMin: number | null;
  powerMax: number | null;
  image: string;
  inStock: boolean;
  leadTime: string | null;
  subCategorySlug: string;
  /** Модель газовой рампы (хвост после «+») */
  ramp: string;
  /** TC | TL | "" */
  tubeLength: string;
  /** true = в рампе есть -CT */
  leakControl: boolean;
  fuelTypeLabel: string;
};

export type BurnerSeries = {
  series: string;
  slug: string;
  path: string;
  modelCount: number;
  filters: {
    ramp: string[];
    tubeLength: string[];
    leakControl: boolean[];
  };
  priceMin: number | null;
  priceMax: number | null;
  priceEurMin: number | null;
  priceEurMax: number | null;
  powerMin: number | null;
  powerMax: number | null;
  image: string;
  models: BurnerModel[];
};

export type BurnersCatalogTree = {
  brand: string;
  version: number;
  generatedFrom: string;
  seriesCount: number;
  modelCount: number;
  series: BurnerSeries[];
};

const tree = treeJson as BurnersCatalogTree;

const skuToSeries = new Map<string, BurnerSeries>();
const skuToModel = new Map<string, BurnerModel>();
for (const series of tree.series ?? []) {
  for (const model of series.models) {
    if (!model.sku) continue;
    const key = model.sku.trim();
    skuToSeries.set(key, series);
    skuToSeries.set(key.toLowerCase(), series);
    skuToModel.set(key, model);
    skuToModel.set(key.toLowerCase(), model);
  }
}

export function getBurnersCatalogTree(): BurnersCatalogTree {
  return tree;
}

export function getAllBurnerSeries(): BurnerSeries[] {
  return tree.series ?? [];
}

export function getBurnerSeriesBySlug(slug: string): BurnerSeries | undefined {
  const key = (slug || "").trim().toLowerCase();
  return tree.series.find((s) => s.slug.toLowerCase() === key);
}

export function getBurnerSeriesBySku(sku: string): BurnerSeries | undefined {
  const key = (sku || "").trim();
  if (!key) return undefined;
  return skuToSeries.get(key) ?? skuToSeries.get(key.toLowerCase());
}

/** Модель горелки FBR по артикулу (цены / наличие / мощность из дерева CSV). */
export function getBurnerModelBySku(
  sku: string | undefined | null
): BurnerModel | undefined {
  const key = (sku || "").trim();
  if (!key) return undefined;
  return skuToModel.get(key) ?? skuToModel.get(key.toLowerCase());
}

export function isFbrBurnerSku(sku: string | undefined | null): boolean {
  const key = (sku || "").trim();
  return Boolean(key && (skuToModel.has(key) || skuToModel.has(key.toLowerCase())));
}

/** Поля товара, которые перекрываются деревом FBR. */
export type FbrOverlayable = {
  sku?: string;
  priceEur?: number;
  priceRub?: number;
  inStock?: boolean;
  leadTime?: string;
  burnerPowerMin?: number;
  burnerPowerMax?: number;
};

/**
 * Подставляет цену, наличие, срок и мощность из burners_catalog_tree
 * (CSV), чтобы каталог совпадал со страницей серии.
 */
export function withFbrCatalogOverlay<T extends FbrOverlayable>(product: T): T {
  const model = getBurnerModelBySku(product.sku);
  if (!model) return product;

  const next: T = {
    ...product,
    inStock: model.inStock,
  };

  if (model.priceEur != null && model.priceEur > 0) {
    next.priceEur = model.priceEur;
    // Дерево в EUR — не оставляем устаревший priceRub из products.ts
    if (model.priceRub == null) {
      next.priceRub = undefined;
    }
  }
  if (model.priceRub != null && model.priceRub > 0) {
    next.priceRub = model.priceRub;
  }
  if (model.leadTime != null) {
    next.leadTime = model.leadTime;
  }
  if (model.powerMin != null) {
    next.burnerPowerMin = model.powerMin;
  }
  if (model.powerMax != null) {
    next.burnerPowerMax = model.powerMax;
  }

  return next;
}

export function withFbrCatalogOverlayAll<T extends FbrOverlayable>(
  list: T[]
): T[] {
  return list.map(withFbrCatalogOverlay);
}

export function getBurnerSeriesHrefBySku(
  sku: string | undefined | null
): string | null {
  return getBurnerSeriesBySku(sku || "")?.path ?? null;
}

export function getBurnerSeriesHrefWithSku(
  sku: string | undefined | null
): string | null {
  const key = (sku || "").trim();
  const series = getBurnerSeriesBySku(key);
  if (!series) return null;
  return `${series.path}?sku=${encodeURIComponent(key)}`;
}

/** Маппинг старых /product/{slug|sku} → серия?sku= (для 301). */
const legacyProductRedirects = new Map<string, string>();
function addLegacyProductRedirect(key: string | undefined | null, href: string) {
  const k = (key || "").trim();
  if (!k) return;
  legacyProductRedirects.set(k, href);
  legacyProductRedirects.set(k.toLowerCase(), href);
}
for (const series of tree.series ?? []) {
  for (const model of series.models) {
    const href = getBurnerSeriesHrefWithSku(model.sku);
    if (!href) continue;
    addLegacyProductRedirect(model.sku, href);
    addLegacyProductRedirect(model.productSlug, href);
  }
}

/**
 * 301-цель для старой карточки горелки FBR по slug или артикулу.
 * Пример: gorelka-gazovaya-fbr-gas-p-100-2-… → /catalog/gorelki-fbr-…?sku=
 */
export function getFbrLegacyProductRedirect(
  slugOrSku: string | undefined | null
): string | null {
  const key = (slugOrSku || "").trim();
  if (!key) return null;
  return (
    legacyProductRedirects.get(key) ??
    legacyProductRedirects.get(key.toLowerCase()) ??
    null
  );
}

export function getBurnerModel(
  series: BurnerSeries,
  sku: string | undefined | null
): BurnerModel | undefined {
  if (!sku) return undefined;
  const key = sku.trim();
  return (
    series.models.find((m) => m.sku === key) ??
    series.models.find((m) => m.sku.toLowerCase() === key.toLowerCase())
  );
}

export function buildBurnerSeriesCanonicalPath(slug: string): string {
  return `/catalog/${slug}`;
}

export function formatBurnerPower(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min != null && max != null && min !== max) return `${min}–${max} кВт`;
  const single = min ?? max;
  if (single != null) return `${single} кВт`;
  return "—";
}

export function leakControlLabel(value: boolean): string {
  return value ? "С контролем герметичности (CT)" : "Без CT";
}

export function tubeLengthLabel(value: string): string {
  if (value === "TC") return "TC (короткая)";
  if (value === "TL") return "TL (длинная)";
  return value || "—";
}
