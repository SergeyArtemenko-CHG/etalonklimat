import type { Product } from "@/data/products";

export type SpecFieldMeta = {
  isNumeric: boolean;
  filterable?: boolean;
};

export type SpecFieldMetaMap = Record<string, SpecFieldMeta>;

export type SpecFilterDefinition =
  | {
      id: string;
      type: "range";
      label: string;
      key: string;
    }
  | {
      id: string;
      type: "range-pair";
      label: string;
      minKey: string;
      maxKey: string;
    }
  | {
      id: string;
      type: "text";
      label: string;
      key: string;
      options: string[];
    };

function normalizeForPair(key: string): string {
  return (key || "")
    .toUpperCase()
    .replace(/[.,;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePairRole(key: string): { base: string; role: "min" | "max" | null } {
  const n = normalizeForPair(key);
  const words = n.split(" ");
  const roleMin = words.some((w) => w === "МИН" || w === "MIN");
  const roleMax = words.some((w) => w === "МАКС" || w === "MAX");
  if (roleMin === roleMax) return { base: n, role: null };
  const filteredWords = words.filter(
    (w) => w !== "МИН" && w !== "MIN" && w !== "МАКС" && w !== "MAX"
  );
  return { base: filteredWords.join(" ").trim(), role: roleMin ? "min" : "max" };
}

export function parseSpecNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const normalized = String(raw).replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

function getSpecRawValue(product: Product, key: string): string | undefined {
  if (!product.specs) return undefined;
  if (product.specs[key] != null) return product.specs[key];
  const target = key.trim().replace(/\s+/g, " ");
  for (const [k, v] of Object.entries(product.specs)) {
    if (k.trim().replace(/\s+/g, " ") === target) return v;
  }
  return undefined;
}

export function getRangeValue(
  product: Product,
  filter: Extract<SpecFilterDefinition, { type: "range" | "range-pair" }>
): { min: number; max: number } | null {
  if (filter.type === "range") {
    const raw = getSpecRawValue(product, filter.key);
    if (!raw) return null;
    const num = parseSpecNumber(raw);
    return { min: num, max: num };
  }
  const rawMin = getSpecRawValue(product, filter.minKey);
  const rawMax = getSpecRawValue(product, filter.maxKey);
  if (!rawMin && !rawMax) return null;
  const min = parseSpecNumber(rawMin);
  const max = parseSpecNumber(rawMax || rawMin);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

export function getTextValue(
  product: Product,
  filter: Extract<SpecFilterDefinition, { type: "text" }>
): string {
  return (getSpecRawValue(product, filter.key) || "").trim();
}

export function buildDynamicSpecFilters(
  products: Product[],
  specFieldMeta: SpecFieldMetaMap,
  specFieldOrder: string[] = []
): SpecFilterDefinition[] {
  const keySet = new Set<string>();
  products.forEach((p) => {
    Object.keys(p.specs || {}).forEach((k) => keySet.add(k));
  });
  const orderIndex = new Map<string, number>();
  specFieldOrder.forEach((k, idx) => orderIndex.set(k, idx));
  const keyOrder = (key: string) =>
    orderIndex.has(key) ? orderIndex.get(key)! : Number.MAX_SAFE_INTEGER;
  const keys = Array.from(keySet).sort((a, b) => {
    const ai = keyOrder(a);
    const bi = keyOrder(b);
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, "ru");
  });

  const pairMap = new Map<string, { label: string; minKey?: string; maxKey?: string }>();
  for (const key of keys) {
    const { base, role } = parsePairRole(key);
    if (!role || !base) continue;
    if (!pairMap.has(base)) pairMap.set(base, { label: base });
    const entry = pairMap.get(base)!;
    if (role === "min") entry.minKey = key;
    if (role === "max") entry.maxKey = key;
  }

  const used = new Set<string>();
  const filters: SpecFilterDefinition[] = [];

  const pairEntries = Array.from(pairMap.entries()).sort(([, a], [, b]) => {
    const aIdx = Math.min(
      keyOrder(a.minKey || ""),
      keyOrder(a.maxKey || "")
    );
    const bIdx = Math.min(
      keyOrder(b.minKey || ""),
      keyOrder(b.maxKey || "")
    );
    if (aIdx !== bIdx) return aIdx - bIdx;
    return (a.label || "").localeCompare(b.label || "", "ru");
  });

  for (const [base, entry] of pairEntries) {
    if (!entry.minKey || !entry.maxKey) continue;
    const minMeta = specFieldMeta[entry.minKey];
    const maxMeta = specFieldMeta[entry.maxKey];
    if (!minMeta?.isNumeric || !maxMeta?.isNumeric) continue;
    if (!minMeta?.filterable || !maxMeta?.filterable) continue;
    used.add(entry.minKey);
    used.add(entry.maxKey);
    filters.push({
      id: `pair:${base}`,
      type: "range-pair",
      label: entry.label,
      minKey: entry.minKey,
      maxKey: entry.maxKey,
    });
  }

  for (const key of keys) {
    if (used.has(key)) continue;
    const meta = specFieldMeta[key];
    if (!meta?.filterable) continue;
    if (meta?.isNumeric) {
      filters.push({ id: `num:${key}`, type: "range", label: key, key });
      continue;
    }
    const options = Array.from(
      new Set(
        products
          .map((p) => (p.specs?.[key] || "").trim())
          .filter((v) => v.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "ru"));
    if (options.length > 0) {
      filters.push({ id: `text:${key}`, type: "text", label: key, key, options });
    }
  }

  return filters.sort((a, b) => {
    const getIdx = (f: SpecFilterDefinition) => {
      if (f.type === "range") return keyOrder(f.key);
      if (f.type === "range-pair") return Math.min(keyOrder(f.minKey), keyOrder(f.maxKey));
      return keyOrder(f.key);
    };
    const ai = getIdx(a);
    const bi = getIdx(b);
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label, "ru");
  });
}
