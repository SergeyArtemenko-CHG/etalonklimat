import type { Product } from "@/data/products";

const SPEC_NAMES = {
  BOILER_POWER: "Мощность котла, кВт",
  STEAM_OUTPUT: "Паропроизводительность котла, кг пара в час",
  WORKING_PRESSURE: "Рабочее давление котла, бар",
} as const;

function parseSpecValue(value: string): { min: number; max: number } | null {
  const s = (value ?? "").toString().trim().replace(/,/g, ".");
  const matches = s.match(/[\d.]+/g);
  if (!matches?.length) return null;
  const numbers = matches.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function findSpec(product: Product, name: string): { min: number; max: number } | null {
  const spec = product.specs?.find((s) => s.name === name || s.name.includes(name));
  if (!spec?.value) return null;
  return parseSpecValue(spec.value);
}

export function getBoilerPowerRange(product: Product): { min: number; max: number } | null {
  return findSpec(product, SPEC_NAMES.BOILER_POWER);
}

export function getSteamOutputRange(product: Product): { min: number; max: number } | null {
  return findSpec(product, SPEC_NAMES.STEAM_OUTPUT);
}

export function getWorkingPressureRange(product: Product): { min: number; max: number } | null {
  return findSpec(product, SPEC_NAMES.WORKING_PRESSURE);
}
