"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DownloadPriceBtn from "./DownloadPriceBtn";
import * as Slider from "@radix-ui/react-slider";
import { fromLog, toLog } from "@/utils/math";
import { useFilterStore } from "@/store/useFilterStore";
import type { Product } from "@/data/products";

type SidebarProps = {
  products?: Product[];
  filteredCount?: number;
};

export default function Sidebar({
  products = [],
  filteredCount = 0,
}: SidebarProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const fuelRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const powerRef = useRef<HTMLDivElement>(null);
  const boilerTypeRef = useRef<HTMLDivElement>(null);
  const heatExchangerRef = useRef<HTMLDivElement>(null);

  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const brands = useFilterStore((s) => s.brands);
  const powerMin = useFilterStore((s) => s.powerMin);
  const powerMax = useFilterStore((s) => s.powerMax);
  const toggleFuelType = useFilterStore((s) => s.toggleFuelType);
  const toggleBrand = useFilterStore((s) => s.toggleBrand);
  const setPowerMin = useFilterStore((s) => s.setPowerMin);
  const setPowerMax = useFilterStore((s) => s.setPowerMax);
  const setPowerRange = useFilterStore((s) => s.setPowerRange);
  const boilerTypes = useFilterStore((s) => s.boilerTypes);
  const heatExchangerMaterials = useFilterStore((s) => s.heatExchangerMaterials);
  const toggleBoilerType = useFilterStore((s) => s.toggleBoilerType);
  const toggleHeatExchangerMaterial = useFilterStore(
    (s) => s.toggleHeatExchangerMaterial
  );
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

  const uniqueFuelTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.fuelType?.trim()) set.add(p.fuelType.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand?.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const uniqueBoilerTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.boilerType?.trim()) set.add(p.boilerType.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const uniqueHeatExchangerMaterials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.heatExchangerMaterial?.trim())
        set.add(p.heatExchangerMaterial.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const powerRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    products.forEach((p) => {
      const pMin = p.burnerPowerMin ?? p.burnerPowerMax;
      const pMax = p.burnerPowerMax ?? p.burnerPowerMin;
      if (pMin != null && pMin < min) min = pMin;
      if (pMax != null && pMax > max) max = pMax;
    });
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min >= max) max = min + 1;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  const hasPowerData = useMemo(
    () =>
      products.some(
        (p) => p.burnerPowerMin != null || p.burnerPowerMax != null
      ),
    [products]
  );

  const sliderValue = useMemo(() => {
    const pMin = powerMin ?? powerRange.min;
    const pMax = powerMax ?? powerRange.max;
    return [
      toLog(pMin, powerRange.min, powerRange.max),
      toLog(pMax, powerRange.min, powerRange.max),
    ];
  }, [powerMin, powerMax, powerRange.min, powerRange.max]);

  const handleFuelToggle = (ft: string) => {
    toggleFuelType(ft);
    showFilterTooltip(fuelRef);
  };

  const handleBrandToggle = (b: string) => {
    toggleBrand(b);
    showFilterTooltip(brandRef);
  };

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

  const handleBoilerTypeToggle = (value: string) => {
    toggleBoilerType(value);
    showFilterTooltip(boilerTypeRef);
  };

  const handleHeatExchangerToggle = (value: string) => {
    toggleHeatExchangerMaterial(value);
    showFilterTooltip(heatExchangerRef);
  };

  const hasActiveFilters =
    fuelTypes.length > 0 ||
    brands.length > 0 ||
    powerMin != null ||
    powerMax != null ||
    boilerTypes.length > 0 ||
    heatExchangerMaterials.length > 0;

  const showFilters = products.length > 0;

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

  return (
    <aside ref={asideRef} className="relative w-full rounded-xl bg-[#003366] p-4 shadow-lg shadow-slate-800/30">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
        Фильтры
      </h2>

      {showFilters && (
        <div className="mt-4 space-y-5 border-t border-white/20 pt-4">
          {uniqueFuelTypes.length > 0 && (
            <div ref={fuelRef} className="relative">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Вид топлива
              </h3>
              <div className="space-y-2">
                {uniqueFuelTypes.map((ft) => (
                  <label
                    key={ft}
                    className="flex cursor-pointer items-center gap-2 text-sm text-white/90"
                  >
                    <input
                      type="checkbox"
                      checked={fuelTypes.includes(ft)}
                      onChange={() => handleFuelToggle(ft)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-[#FF8C00] focus:ring-[#FF8C00]"
                    />
                    <span>{ft}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {uniqueBrands.length > 0 && (
            <div ref={brandRef} className="relative">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Бренд
              </h3>
              <div className="space-y-2">
                {uniqueBrands.map((b) => (
                  <label
                    key={b}
                    className="flex cursor-pointer items-center gap-2 text-sm text-white/90"
                  >
                    <input
                      type="checkbox"
                      checked={brands.includes(b)}
                      onChange={() => handleBrandToggle(b)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-[#FF8C00] focus:ring-[#FF8C00]"
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {hasPowerData && (
          <div ref={powerRef} className="relative">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
              Мощность, кВт
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

          {uniqueBoilerTypes.length > 0 && (
            <div ref={boilerTypeRef} className="relative">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Тип котла
              </h3>
              <div className="space-y-2">
                {uniqueBoilerTypes.map((bt) => (
                  <label
                    key={bt}
                    className="flex cursor-pointer items-center gap-2 text-sm text-white/90"
                  >
                    <input
                      type="checkbox"
                      checked={boilerTypes.includes(bt)}
                      onChange={() => handleBoilerTypeToggle(bt)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-[#FF8C00] focus:ring-[#FF8C00]"
                    />
                    <span>{bt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {uniqueHeatExchangerMaterials.length > 0 && (
            <div ref={heatExchangerRef} className="relative">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Материал теплообменника
              </h3>
              <div className="space-y-2">
                {uniqueHeatExchangerMaterials.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-2 text-sm text-white/90"
                  >
                    <input
                      type="checkbox"
                      checked={heatExchangerMaterials.includes(m)}
                      onChange={() => handleHeatExchangerToggle(m)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-[#FF8C00] focus:ring-[#FF8C00]"
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </div>
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
