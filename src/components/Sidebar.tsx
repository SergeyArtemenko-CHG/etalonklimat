"use client";

import { useEffect, useMemo, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import DownloadPriceBtn from "./DownloadPriceBtn";
import { useFilterStore } from "@/store/useFilterStore";
import {
  buildDynamicSpecFilters,
  getRangeValue,
  parseSpecNumber,
  type SpecFilterDefinition,
} from "@/config/specFilterBuilder";
import { specFieldMeta, specFieldOrder, type Product } from "@/data/products";

type SidebarProps = {
  products?: Product[];
  /** Страница бренда: бренд уже зафиксирован фильтром */
  hideBrandFilter?: boolean;
};

function toLogSlider(value: number, min: number, max: number): number {
  const safeMin = Math.max(min, 0.0001);
  const safeMax = Math.max(max, safeMin + 0.0001);
  const v = Math.min(safeMax, Math.max(safeMin, value));
  const minLog = Math.log(safeMin);
  const maxLog = Math.log(safeMax);
  return ((Math.log(v) - minLog) / (maxLog - minLog)) * 100;
}

function fromLogSlider(slider: number, min: number, max: number): number {
  const safeMin = Math.max(min, 0.0001);
  const safeMax = Math.max(max, safeMin + 0.0001);
  const minLog = Math.log(safeMin);
  const maxLog = Math.log(safeMax);
  const t = Math.min(100, Math.max(0, slider)) / 100;
  return Number(Math.exp(minLog + t * (maxLog - minLog)).toFixed(3));
}

export default function Sidebar({ products = [], hideBrandFilter = false }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const safeProducts = products ?? [];

  useEffect(() => setMounted(true), []);

  const inStockOnly = useFilterStore((s) => s.inStockOnly);
  const setInStockOnly = useFilterStore((s) => s.setInStockOnly);
  const selectedBrands = useFilterStore((s) => s.brands);
  const toggleBrand = useFilterStore((s) => s.toggleBrand);
  const numericRanges = useFilterStore((s) => s.numericRanges);
  const setNumericRange = useFilterStore((s) => s.setNumericRange);
  const clearMissingNumericRanges = useFilterStore((s) => s.clearMissingNumericRanges);
  const specTextFilters = useFilterStore((s) => s.specTextFilters);
  const toggleSpecTextValue = useFilterStore((s) => s.toggleSpecTextValue);
  const clearMissingSpecTextFilters = useFilterStore((s) => s.clearMissingSpecTextFilters);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const brandOptions = useMemo(() => {
    const values = new Set(
      safeProducts
        .map((p) => (p.brand || "").trim())
        .filter((v) => v.length > 0)
    );
    return Array.from(values).sort((a, b) => a.localeCompare(b, "ru"));
  }, [safeProducts]);

  const dynamicFilters = useMemo(
    () => buildDynamicSpecFilters(safeProducts, specFieldMeta, specFieldOrder),
    [safeProducts]
  );

  const textFilters = useMemo(
    () => dynamicFilters.filter((f) => f.type === "text") as Array<
      Extract<SpecFilterDefinition, { type: "text" }>
    >,
    [dynamicFilters]
  );
  const rangeFilters = useMemo(
    () =>
      dynamicFilters.filter(
        (f) => f.type === "range" || f.type === "range-pair"
      ) as Array<Extract<SpecFilterDefinition, { type: "range" | "range-pair" }>>,
    [dynamicFilters]
  );

  const rangeLimits = useMemo(() => {
    return rangeFilters
      .map((def) => {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        safeProducts.forEach((p) => {
          const value = getRangeValue(p, def);
          if (!value) return;
          if (value.min < min) min = value.min;
          if (value.max > max) max = value.max;
        });
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        if (min === max) max = min + 1;
        return { def, min, max };
      })
      .filter(Boolean) as Array<{
      def: Extract<SpecFilterDefinition, { type: "range" | "range-pair" }>;
      min: number;
      max: number;
    }>;
  }, [rangeFilters, safeProducts]);

  useEffect(() => {
    clearMissingNumericRanges(rangeLimits.map((x) => x.def.id));
  }, [rangeLimits, clearMissingNumericRanges]);

  useEffect(() => {
    clearMissingSpecTextFilters(textFilters.map((x) => x.id));
  }, [textFilters, clearMissingSpecTextFilters]);

  const hasActiveFilters =
    inStockOnly ||
    selectedBrands.length > 0 ||
    Object.values(numericRanges).some((r) => r && (r.min != null || r.max != null)) ||
    Object.values(specTextFilters).some((arr) => arr.length > 0);

  if (!mounted) {
    return (
      <aside className="z-30 w-full rounded-xl bg-primary p-4 shadow-lg shadow-black/20 md:sticky md:top-32 md:self-start">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
          Фильтры
        </h2>
        <div className="mt-4 border-t border-white/20 pt-4 text-xs text-white/70">
          Загрузка…
        </div>
      </aside>
    );
  }

  return (
    <aside className="z-30 w-full rounded-xl bg-primary p-4 shadow-lg shadow-black/20 md:sticky md:top-32 md:self-start">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
        Фильтры
      </h2>

      <div className="mt-4 space-y-5 border-t border-white/20 pt-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-white/40 bg-white/10 text-accent focus:ring-accent focus:ring-offset-0"
          />
          <span className="text-sm font-medium text-white/90">В наличии</span>
        </label>

        {!hideBrandFilter && brandOptions.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
              Бренд
            </h3>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/20 bg-white/5 p-2">
              {brandOptions.map((brand) => (
                <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-4 w-4 rounded border-white/40 bg-white/10 text-accent focus:ring-accent focus:ring-offset-0"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {rangeLimits.map(({ def, min, max }) => {
          const selected = numericRanges[def.id] || { min: null, max: null };
          const actualMin = selected.min ?? min;
          const actualMax = selected.max ?? max;
          const sliderMin = toLogSlider(actualMin, min, max);
          const sliderMax = toLogSlider(actualMax, min, max);
          return (
            <div key={def.id}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                {def.label}
              </h3>
              <Slider.Root
                min={0}
                max={100}
                step={0.25}
                value={[sliderMin, sliderMax]}
                onValueChange={(values) =>
                  setNumericRange(def.id, fromLogSlider(values[0], min, max), fromLogSlider(values[1], min, max))
                }
                className="relative flex w-full touch-none select-none items-center py-4"
              >
                <Slider.Track className="relative h-2 w-full grow rounded-full bg-white/30">
                  <Slider.Range className="absolute h-full rounded-full bg-accent" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-white shadow-sm outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary" />
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-white shadow-sm outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary" />
              </Slider.Root>
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/70">
                <span>{min.toLocaleString("ru-RU")}</span>
                <span>{max.toLocaleString("ru-RU")}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={0.1}
                  value={selected.min ?? ""}
                  placeholder={`мин ${min}`}
                  onChange={(e) =>
                    setNumericRange(
                      def.id,
                      e.target.value === "" ? null : parseSpecNumber(e.target.value),
                      selected.max
                    )
                  }
                  className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={0.1}
                  value={selected.max ?? ""}
                  placeholder={`макс ${max}`}
                  onChange={(e) =>
                    setNumericRange(
                      def.id,
                      selected.min,
                      e.target.value === "" ? null : parseSpecNumber(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          );
        })}

        {textFilters.map((filter) => {
          const selected = specTextFilters[filter.id] ?? [];
          return (
            <div key={filter.id}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                {filter.label}
              </h3>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/20 bg-white/5 p-2">
                {filter.options.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => toggleSpecTextValue(filter.id, option)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-accent focus:ring-accent focus:ring-offset-0"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/20"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      <DownloadPriceBtn />
    </aside>
  );
}
