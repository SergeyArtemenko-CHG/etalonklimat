"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DownloadPriceBtn from "./DownloadPriceBtn";
import * as Slider from "@radix-ui/react-slider";
import { fromLog, toLog } from "@/utils/math";
import {
  getBoilerPowerRange,
  getSteamOutputRange,
  getWorkingPressureRange,
} from "@/utils/specs";
import { useFilterStore } from "@/store/useFilterStore";
import type { Product } from "@/data/products";

type SidebarProps = {
  products?: Product[];
  filteredCount?: number;
  categorySlug?: string;
};

export default function Sidebar({
  products = [],
  filteredCount = 0,
  categorySlug = "",
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const powerRef = useRef<HTMLDivElement>(null);
  const boilerPowerRef = useRef<HTMLDivElement>(null);
  const steamOutputRef = useRef<HTMLDivElement>(null);
  const workingPressureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeProducts = products ?? [];

  const inStockOnly = useFilterStore((s) => s.inStockOnly);
  const setInStockOnly = useFilterStore((s) => s.setInStockOnly);
  const powerMin = useFilterStore((s) => s.powerMin);
  const powerMax = useFilterStore((s) => s.powerMax);
  const setPowerMin = useFilterStore((s) => s.setPowerMin);
  const setPowerMax = useFilterStore((s) => s.setPowerMax);
  const setPowerRange = useFilterStore((s) => s.setPowerRange);
  const boilerPowerMin = useFilterStore((s) => s.boilerPowerMin);
  const boilerPowerMax = useFilterStore((s) => s.boilerPowerMax);
  const setBoilerPowerRange = useFilterStore((s) => s.setBoilerPowerRange);
  const steamOutputMin = useFilterStore((s) => s.steamOutputMin);
  const steamOutputMax = useFilterStore((s) => s.steamOutputMax);
  const setSteamOutputRange = useFilterStore((s) => s.setSteamOutputRange);
  const workingPressureMin = useFilterStore((s) => s.workingPressureMin);
  const workingPressureMax = useFilterStore((s) => s.workingPressureMax);
  const setWorkingPressureRange = useFilterStore((s) => s.setWorkingPressureRange);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const showFilterTooltip = useCallback((anchorRef: React.RefObject<HTMLDivElement | null>) => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltipAnchor(anchorRef.current);
    setTooltipVisible(true);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipVisible(false);
      setTooltipAnchor(null);
      tooltipTimerRef.current = null;
    }, 3000);
  }, []);

  const dismissTooltip = useCallback(() => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltipVisible(false);
    setTooltipAnchor(null);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const powerRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    safeProducts.forEach((p) => {
      const pMin = p.burnerPowerMin ?? p.burnerPowerMax;
      const pMax = p.burnerPowerMax ?? p.burnerPowerMin;
      if (pMin != null && pMin < min) min = pMin;
      if (pMax != null && pMax > max) max = pMax;
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min >= max) max = min + 1;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [safeProducts]);

  const boilerPowerRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    safeProducts.forEach((p) => {
      const r = getBoilerPowerRange(p);
      if (r) {
        if (r.min < min) min = r.min;
        if (r.max > max) max = r.max;
      }
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min >= max) max = min + 1;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [safeProducts]);

  const steamOutputRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    safeProducts.forEach((p) => {
      const r = getSteamOutputRange(p);
      if (r) {
        if (r.min < min) min = r.min;
        if (r.max > max) max = r.max;
      }
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min >= max) max = min + 1;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [safeProducts]);

  const workingPressureRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    safeProducts.forEach((p) => {
      const r = getWorkingPressureRange(p);
      if (r) {
        if (r.min < min) min = r.min;
        if (r.max > max) max = r.max;
      }
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 10;
    if (min >= max) max = min + 1;
    return { min: Math.floor(min * 10) / 10, max: Math.ceil(max * 10) / 10 };
  }, [safeProducts]);

  const filterMode = useMemo((): "burner" | "steam" | "water" => {
    if (categorySlug === "kotly-parovye") return "steam";
    if (categorySlug === "kotly-vodogreinye") return "water";
    return "burner";
  }, [categorySlug]);

  const hasPowerData = useMemo(
    () =>
      safeProducts.some(
        (p) => p.burnerPowerMin != null || p.burnerPowerMax != null
      ),
    [safeProducts]
  );

  const hasBoilerPowerData = useMemo(
    () => safeProducts.some((p) => getBoilerPowerRange(p) != null),
    [safeProducts]
  );
  const hasSteamOutputData = useMemo(
    () => safeProducts.some((p) => getSteamOutputRange(p) != null),
    [safeProducts]
  );
  const hasWorkingPressureData = useMemo(
    () => safeProducts.some((p) => getWorkingPressureRange(p) != null),
    [safeProducts]
  );

  const sliderValue = useMemo(() => {
    const pMin = powerMin ?? powerRange.min;
    const pMax = powerMax ?? powerRange.max;
    return [
      toLog(pMin, powerRange.min, powerRange.max),
      toLog(pMax, powerRange.min, powerRange.max),
    ];
  }, [powerMin, powerMax, powerRange.min, powerRange.max]);

  const handleSliderChange = (value: number[]) => {
    const kwMin = fromLog(value[0], powerRange.min, powerRange.max);
    const kwMax = fromLog(value[1], powerRange.min, powerRange.max);
    setPowerRange(kwMin, kwMax);
    showFilterTooltip(powerRef);
  };

  const handlePowerMinInput = (v: string) => {
    const num = v === "" ? null : Number(v);
    setPowerMin(num);
    showFilterTooltip(powerRef);
  };

  const handlePowerMaxInput = (v: string) => {
    const num = v === "" ? null : Number(v);
    setPowerMax(num);
    showFilterTooltip(powerRef);
  };

  const hasActiveFilters =
    inStockOnly ||
    powerMin != null ||
    powerMax != null ||
    boilerPowerMin != null ||
    boilerPowerMax != null ||
    steamOutputMin != null ||
    steamOutputMax != null ||
    workingPressureMin != null ||
    workingPressureMax != null;

  const showFilters = safeProducts.length > 0;

  const renderSpecFilter = (
    title: string,
    range: { min: number; max: number },
    filterMin: number | null,
    filterMax: number | null,
    setRange: (min: number | null, max: number | null) => void,
    hasData: boolean,
    anchorRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const val = [
      toLog(filterMin ?? range.min, range.min, range.max),
      toLog(filterMax ?? range.max, range.min, range.max),
    ];
    return (
      hasData && (
        <div ref={anchorRef} className="relative">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
            {title}
          </h3>
          <Slider.Root
            min={0}
            max={100}
            step={0.5}
            value={val}
            onValueChange={(v) => {
              const kwMin = fromLog(v[0], range.min, range.max);
              const kwMax = fromLog(v[1], range.min, range.max);
              setRange(kwMin, kwMax);
              showFilterTooltip(anchorRef);
            }}
            className="relative flex w-full touch-none select-none items-center py-4"
          >
            <Slider.Track className="relative h-2 w-full grow rounded-full bg-white/30">
              <Slider.Range className="absolute h-full rounded-full bg-[#FF8C00]" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-[#FF8C00] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2 focus:ring-offset-[#003366]" />
            <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-[#FF8C00] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2 focus:ring-offset-[#003366]" />
          </Slider.Root>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-0.5 block text-xs text-white/70">Мин.</label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                step={0.1}
                placeholder="—"
                value={filterMin ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setRange(v === "" ? null : Number(v), filterMax);
                  showFilterTooltip(anchorRef);
                }}
                className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-0.5 block text-xs text-white/70">Макс.</label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                step={0.1}
                placeholder="—"
                value={filterMax ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setRange(filterMin, v === "" ? null : Number(v));
                  showFilterTooltip(anchorRef);
                }}
                className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
              />
            </div>
          </div>
        </div>
      )
    );
  };

  const tooltipStyle = useMemo(() => {
    if (!tooltipVisible || !tooltipAnchor || !asideRef.current) return undefined;
    const ar = asideRef.current.getBoundingClientRect();
    const tr = tooltipAnchor.getBoundingClientRect();
    return {
      top: tr.bottom - ar.top + 8,
      left: 16,
      right: 16,
    };
  }, [tooltipVisible, tooltipAnchor]);

  if (!mounted) {
    return (
      <aside className="w-full rounded-xl bg-[#003366] p-4 shadow-lg shadow-slate-800/30 md:sticky md:top-24 md:self-start">
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
    <aside
      ref={asideRef}
      className="w-full rounded-xl bg-[#003366] p-4 shadow-lg shadow-slate-800/30 md:sticky md:top-24 md:self-start"
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
        Фильтры
      </h2>

      {showFilters && (
        <div className="mt-4 space-y-5 border-t border-white/20 pt-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-white/40 bg-white/10 text-[#FF8C00] focus:ring-[#FF8C00] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-white/90">В наличии</span>
          </label>
          {filterMode === "burner" && hasPowerData && (
            <div ref={powerRef} className="relative">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Диапазон мощности, кВт
              </h3>
              <Slider.Root
                min={0}
                max={100}
                step={0.5}
                value={sliderValue}
                onValueChange={handleSliderChange}
                className="relative flex w-full touch-none select-none items-center py-4"
              >
                <Slider.Track className="relative h-2 w-full grow rounded-full bg-white/30">
                  <Slider.Range className="absolute h-full rounded-full bg-[#FF8C00]" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-[#FF8C00] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2 focus:ring-offset-[#003366]" />
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-[#FF8C00] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2 focus:ring-offset-[#003366]" />
              </Slider.Root>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="power-min" className="mb-0.5 block text-xs text-white/70">
                    Мин.
                  </label>
                  <input
                    id="power-min"
                    type="number"
                    min={powerRange.min}
                    max={powerRange.max}
                    step={0.1}
                    placeholder="—"
                    value={powerMin ?? ""}
                    onChange={(e) => handlePowerMinInput(e.target.value)}
                    className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="power-max" className="mb-0.5 block text-xs text-white/70">
                    Макс.
                  </label>
                  <input
                    id="power-max"
                    type="number"
                    min={powerRange.min}
                    max={powerRange.max}
                    step={0.1}
                    placeholder="—"
                    value={powerMax ?? ""}
                    onChange={(e) => handlePowerMaxInput(e.target.value)}
                    className="w-full rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                  />
                </div>
              </div>
            </div>
          )}
          {filterMode === "steam" && (
            <>
              {renderSpecFilter(
                "Мощность котла, кВт",
                boilerPowerRange,
                boilerPowerMin,
                boilerPowerMax,
                setBoilerPowerRange,
                hasBoilerPowerData,
                boilerPowerRef
              )}
              {renderSpecFilter(
                "Паропроизводительность котла, кг пара в час",
                steamOutputRange,
                steamOutputMin,
                steamOutputMax,
                setSteamOutputRange,
                hasSteamOutputData,
                steamOutputRef
              )}
              {renderSpecFilter(
                "Рабочее давление котла, бар",
                workingPressureRange,
                workingPressureMin,
                workingPressureMax,
                setWorkingPressureRange,
                hasWorkingPressureData,
                workingPressureRef
              )}
            </>
          )}
          {filterMode === "water" && (
            <>
              {renderSpecFilter(
                "Мощность котла, кВт",
                boilerPowerRange,
                boilerPowerMin,
                boilerPowerMax,
                setBoilerPowerRange,
                hasBoilerPowerData,
                boilerPowerRef
              )}
              {renderSpecFilter(
                "Рабочее давление котла, бар",
                workingPressureRange,
                workingPressureMin,
                workingPressureMax,
                setWorkingPressureRange,
                hasWorkingPressureData,
                workingPressureRef
              )}
            </>
          )}

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
      )}

      <DownloadPriceBtn />

      {tooltipVisible && tooltipStyle && (
        <div
          className="absolute z-50 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
          style={tooltipStyle}
        >
          <p className="mb-2 text-xs text-slate-600">
            Показать {filteredCount} товаров
          </p>
          <button
            type="button"
            onClick={dismissTooltip}
            className="w-full rounded bg-[#FF8C00] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#ff9f26]"
          >
            Показать
          </button>
        </div>
      )}
    </aside>
  );
}
