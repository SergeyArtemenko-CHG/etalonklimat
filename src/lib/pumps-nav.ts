/**
 * Навигация раздела «Насосы / Vandjord».
 * Меню — плоские ссылки; серии CRV/TPV выводятся плитками на страницах-хабах.
 */

import {
  getAllPumpSeries,
  type PumpSeries,
} from "@/lib/pumps-catalog";

export const PUMPS_CONFIGURATOR_PATH = "/catalog/podbor-nasosov-vandjord";
export const PUMPS_CRV_HUB_PATH = "/catalog/vertikalnye-nasosy-crv";
export const PUMPS_TPV_HUB_PATH = "/catalog/cirkulyacionnye-nasosy-tpv";
export const PUMPS_CATEGORY_SLUG = "nasosy";

/** Старые громоздкие подкатегории /category/... → конфигуратор */
export const LEGACY_PUMP_CATEGORY_SLUGS = [
  "avtomaticheskaya-pogruzhnaya-kolodeznaya-nasosnaya-ustanovka",
  "vertikalnye-mnogostupenchatye-nasosy",
  "vertikalnye-mnogostupenchatye-nasosy-iz-nerzhaveyushchei-stali-aisi-316",
  "gorizontalnye-mnogostupenchatye-nasosy",
  "drenazhnye-nasosy-iz-nerzhaveyushchei-stali",
  "kommercheskie-ustanovki-povysheniya-davleniya",
  "kommercheskie-ustanovki-pozharotusheniya",
  "konsolno-monoblochnye-nasosy",
  "konsolno-monoblochnye-nasosy-iz-nerzhaveyushchei-stali",
  "konsolnye-nasosy",
  "odnostupenchatye-nasosy-in-lain",
  "samovsasyvayushchaya-nasosnaya-ustanovka",
] as const;

export type PumpMenuLink = {
  label: string;
  href: string;
};

/** 4 плоские ссылки для главного меню каталога (в стиле остальных категорий). */
export const PUMPS_FLAT_MENU_LINKS: PumpMenuLink[] = [
  {
    label: "Насосы (конфигуратор)",
    href: PUMPS_CONFIGURATOR_PATH,
  },
  {
    label: "Вертикальные насосы CRV",
    href: PUMPS_CRV_HUB_PATH,
  },
  {
    label: "Циркуляционные насосы TPV",
    href: PUMPS_TPV_HUB_PATH,
  },
  {
    label: "Все серии Vandjord",
    href: `/category/${PUMPS_CATEGORY_SLUG}`,
  },
];

export type PumpNavLink = {
  label: string;
  href: string;
  seriesName: string;
};

function sortCrvSeries(a: PumpSeries, b: PumpSeries): number {
  const num = (s: string) => {
    const m = s.match(/^CRV\s+(\d+)/i);
    return m ? Number(m[1]) : 9999;
  };
  return num(a.series) - num(b.series) || a.series.localeCompare(b.series, "ru");
}

function sortTpvSeries(a: PumpSeries, b: PumpSeries): number {
  const parts = (s: string) => {
    const m = s.match(/^TPV\s+(\d+)(?:\/(\d+))?/i);
    return { dn: m ? Number(m[1]) : 9999, poles: m?.[2] ? Number(m[2]) : 0 };
  };
  const aa = parts(a.series);
  const bb = parts(b.series);
  return aa.dn - bb.dn || aa.poles - bb.poles || a.series.localeCompare(b.series, "ru");
}

/** Серии CRV для плиток на хабе /catalog/vertikalnye-nasosy-crv */
export function getCrvSeriesForNav(): PumpNavLink[] {
  return getAllPumpSeries()
    .filter((s) => /^CRV\s+\d+$/i.test(s.series.trim()))
    .sort(sortCrvSeries)
    .map((s) => ({
      label: `Серия ${s.series}`,
      href: s.path,
      seriesName: s.series,
    }));
}

/** Серии TPV для плиток на хабе /catalog/cirkulyacionnye-nasosy-tpv */
export function getTpvSeriesForNav(): PumpNavLink[] {
  return getAllPumpSeries()
    .filter((s) => /^TPV\s+/i.test(s.series.trim()))
    .sort(sortTpvSeries)
    .map((s) => ({
      label: `Серия ${s.series}`,
      href: s.path,
      seriesName: s.series,
    }));
}

/** Остальные семейства (для витрины /category/nasosy). */
export function getOtherPumpSeriesForNav(): PumpNavLink[] {
  return getAllPumpSeries()
    .filter((s) => {
      const name = s.series.trim();
      if (/^CRV\s+\d+$/i.test(name)) return false;
      if (/^TPV\s+/i.test(name)) return false;
      return true;
    })
    .map((s) => ({
      label: s.series,
      href: s.path,
      seriesName: s.series,
    }));
}

export function getCrvSeriesDetailed(): PumpSeries[] {
  return getAllPumpSeries()
    .filter((s) => /^CRV\s+\d+$/i.test(s.series.trim()))
    .sort(sortCrvSeries);
}

export function getTpvSeriesDetailed(): PumpSeries[] {
  return getAllPumpSeries()
    .filter((s) => /^TPV\s+/i.test(s.series.trim()))
    .sort(sortTpvSeries);
}

export function isLegacyPumpCategorySlug(slug: string): boolean {
  return (LEGACY_PUMP_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

/** Продающее описание для страницы конкретной серии. */
export function buildPumpSeriesIntro(
  seriesName: string,
  modelCount: number,
  priceMin: number | null
): string {
  const pricePart =
    priceMin != null
      ? `, цены от ${priceMin.toLocaleString("ru-RU")} ₽`
      : "";
  const countPart = `${modelCount} модификаций${pricePart}`;
  const name = seriesName.trim();

  if (/^CRV/i.test(name)) {
    return `Вертикальные многоступенчатые центробежные насосы Vandjord предназначены для перекачивания чистых, невязких и взрывобезопасных жидкостей в системах водоснабжения, отопления и повышения давления. В каталоге представлено ${countPart}.`;
  }
  if (/^TPV/i.test(name)) {
    return `Циркуляционные ин-лайн насосы Vandjord ${name} применяются в системах отопления, холодоснабжения и ГВС. Надёжная конструкция и широкий диапазон характеристик. В каталоге представлено ${countPart}.`;
  }
  return `Насосы Vandjord серии ${name} — промышленное насосное оборудование для инженерных систем. В каталоге представлено ${countPart}.`;
}
