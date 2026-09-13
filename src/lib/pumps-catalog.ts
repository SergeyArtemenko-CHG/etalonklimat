/**
 * Каталог серий насосов Vandjord (только эта группа товаров).
 * Данные: src/data/pumps_catalog_tree.json (генерация: scripts/build_pumps_catalog_tree.py)
 */

import treeJson from "@/data/pumps_catalog_tree.json";

export type PumpModel = {
  sku: string;
  name: string;
  priceRub: number | null;
  powerKw: number | null;
  flowM3h: number | null;
  headM: number | null;
  dnMm: number | null;
  polesRpm: string;
  source: string;
  /** true = в наличии (1 в CSV), false = нет (0) */
  inStock: boolean;
};

export type PumpSeries = {
  series: string;
  slug: string;
  path: string;
  modelCount: number;
  filters: {
    headM: number[];
    flowM3h: number[];
    powerKw: number[];
    dnMm: number[];
  };
  priceMin: number | null;
  priceMax: number | null;
  models: PumpModel[];
};

export type PumpsCatalogTree = {
  brand: string;
  version: number;
  generatedFrom: string;
  seriesCount: number;
  modelCount: number;
  series: PumpSeries[];
};

const tree = treeJson as PumpsCatalogTree;

export function getPumpsCatalogTree(): PumpsCatalogTree {
  return tree;
}

export function getAllPumpSeries(): PumpSeries[] {
  return tree.series ?? [];
}

export function getPumpSeriesBySlug(slug: string): PumpSeries | undefined {
  const key = (slug || "").trim().toLowerCase();
  return tree.series.find((s) => s.slug.toLowerCase() === key);
}

const skuToSeries = new Map<string, PumpSeries>();
for (const series of tree.series ?? []) {
  for (const model of series.models) {
    if (model.sku) skuToSeries.set(model.sku.trim(), series);
  }
}

export function getPumpSeriesBySku(sku: string): PumpSeries | undefined {
  const key = (sku || "").trim();
  if (!key) return undefined;
  return skuToSeries.get(key);
}

/** Есть ли артикул в дереве Vandjord (для 301 и ссылок). */
export function isVandjordPumpSku(sku: string | undefined | null): boolean {
  const key = (sku || "").trim();
  return Boolean(key && skuToSeries.has(key));
}

/** URL страницы серии без ?sku= (меню / футер / sitemap). */
export function getPumpSeriesHrefBySku(sku: string | undefined | null): string | null {
  const series = getPumpSeriesBySku(sku || "");
  return series?.path ?? null;
}

/** URL серии с предвыбранной модификацией (редирект со старой карточки). */
export function getPumpSeriesHrefWithSku(sku: string | undefined | null): string | null {
  const key = (sku || "").trim();
  const series = getPumpSeriesBySku(key);
  if (!series) return null;
  return `${series.path}?sku=${encodeURIComponent(key)}`;
}

export function getPumpModel(series: PumpSeries, sku: string | undefined | null): PumpModel | undefined {
  if (!sku) return undefined;
  return series.models.find((m) => m.sku === sku);
}

export function buildPumpSeriesCanonicalPath(slug: string): string {
  return `/catalog/${slug}`;
}

/** Подбор: Q ±20%, H ≥ запроса и не больше +25% */
export function matchPumpsByDuty(
  flowQ: number,
  headH: number,
  options?: { flowTol?: number; headOver?: number }
): Array<{ series: PumpSeries; model: PumpModel; score: number }> {
  const flowTol = options?.flowTol ?? 0.2;
  const headOver = options?.headOver ?? 0.25;
  const qMin = flowQ * (1 - flowTol);
  const qMax = flowQ * (1 + flowTol);
  const hMax = headH * (1 + headOver);

  const hits: Array<{ series: PumpSeries; model: PumpModel; score: number }> = [];

  for (const series of tree.series) {
    for (const model of series.models) {
      const q = model.flowM3h;
      const h = model.headM;
      if (q == null || h == null) continue;
      if (q < qMin || q > qMax) continue;
      if (h < headH || h > hMax) continue;

      const qScore = Math.abs(q - flowQ) / Math.max(flowQ, 0.001);
      const hScore = (h - headH) / Math.max(headH, 0.001);
      hits.push({ series, model, score: qScore * 2 + hScore });
    }
  }

  hits.sort((a, b) => a.score - b.score || (a.model.priceRub ?? 0) - (b.model.priceRub ?? 0));
  return hits;
}

export function formatPumpNum(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  return value.toFixed(digits).replace(/\.?0+$/, "");
}
