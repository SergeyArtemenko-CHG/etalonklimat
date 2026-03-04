import type { Product } from "@/data/products";

const SPEC_NAMES = {
  BOILER_POWER: "Мощность котла, кВт",
  STEAM_OUTPUT: "Паропроизводительность котла, кг пара в час",
  WORKING_PRESSURE: "Рабочее давление котла, бар",
} as const;

function parseSpecValue(value: string): { min: number; max: number } | null {
  try {
    const s = (value ?? "").toString().trim().replace(/,/g, ".");
    const matches = s.match(/[\d.]+/g);
    if (!matches?.length) return null;
    const numbers = matches
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
    if (numbers.length === 0) return null;
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  } catch {
    return null;
  }
}

function findSpec(product: Product, name: string): { min: number; max: number } | null {
  try {
    if (!product?.specs) return null;
    if (!Array.isArray(product.specs)) return null;
    const spec = product.specs.find(
      (s) => s && s.name && (s.name === name || s.name.includes(name))
    );
    if (!spec?.value) return null;
    return parseSpecValue(spec.value);
  } catch {
    return null;
  }
}

export function getBoilerPowerRange(product: Product): { min: number; max: number } | null {
  try {
    return findSpec(product, SPEC_NAMES.BOILER_POWER);
  } catch {
    return null;
  }
}

export function getSteamOutputRange(product: Product): { min: number; max: number } | null {
  try {
    return findSpec(product, SPEC_NAMES.STEAM_OUTPUT);
  } catch {
    return null;
  }
}

export function getWorkingPressureRange(product: Product): { min: number; max: number } | null {
  try {
    return findSpec(product, SPEC_NAMES.WORKING_PRESSURE);
  } catch {
    return null;
  }
}
