import type { Product } from "@/data/products";

export type NumericRangeFilter = {
  id: string;
  label: string;
  minSpecKey: string;
  maxSpecKey: string;
  step?: number;
};

const CATEGORY_FILTERS: Record<string, NumericRangeFilter[]> = {
  "Горелки для котлов отопления": [
    {
      id: "burner_power_kw",
      label: "Диапазон мощности, кВт",
      minSpecKey: "Мощность горелки мин., кВт",
      maxSpecKey: "Мощность горелки макс., кВт",
      step: 0.1,
    },
  ],
  "Котлы паровые": [
    {
      id: "boiler_power_kw",
      label: "Мощность котла, кВт",
      minSpecKey: "Мощность котла, кВт",
      maxSpecKey: "Мощность котла, кВт",
      step: 0.1,
    },
    {
      id: "steam_output",
      label: "Паропроизводительность котла, кг пара в час",
      minSpecKey: "Паропроизводительность котла, кг пара в час",
      maxSpecKey: "Паропроизводительность котла, кг пара в час",
      step: 0.1,
    },
    {
      id: "working_pressure",
      label: "Рабочее давление котла, бар",
      minSpecKey: "Рабочее давление котла, бар",
      maxSpecKey: "Рабочее давление котла, бар",
      step: 0.1,
    },
  ],
  "Котлы водогрейные": [
    {
      id: "boiler_power_kw",
      label: "Мощность котла, кВт",
      minSpecKey: "Мощность котла, кВт",
      maxSpecKey: "Мощность котла, кВт",
      step: 0.1,
    },
    {
      id: "working_pressure",
      label: "Рабочее давление котла, бар",
      minSpecKey: "Рабочее давление котла, бар",
      maxSpecKey: "Рабочее давление котла, бар",
      step: 0.1,
    },
  ],
};

function normalizeKey(v: string): string {
  return (v || "").trim().replace(/\s+/g, " ");
}

function pickSpecValue(specs: Product["specs"], key: string): string {
  if (!specs) return "";
  const direct = specs[key];
  if (direct != null) return `${direct}`.trim();
  const wanted = normalizeKey(key);
  for (const [k, value] of Object.entries(specs)) {
    if (normalizeKey(k) === wanted) return `${value}`.trim();
  }
  return "";
}

function parseSpecNumber(raw: string): number {
  const normalized = `${raw || ""}`.replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function getFiltersForProducts(products: Product[]): NumericRangeFilter[] {
  const byId = new Map<string, NumericRangeFilter>();
  const categoryNames = new Set(
    (products || []).map((p) => (p.category || "").trim()).filter(Boolean)
  );
  for (const name of categoryNames) {
    const defs = CATEGORY_FILTERS[name] || [];
    defs.forEach((def) => byId.set(def.id, def));
  }
  return Array.from(byId.values());
}

export function getProductRangeValue(
  product: Product,
  def: NumericRangeFilter
): { min: number; max: number } | null {
  const rawMin = pickSpecValue(product.specs, def.minSpecKey);
  const rawMax = pickSpecValue(product.specs, def.maxSpecKey);
  if (!rawMin && !rawMax) return null;
  const min = parseSpecNumber(rawMin);
  const max = parseSpecNumber(rawMax || rawMin);
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return { min: lo, max: hi };
}
