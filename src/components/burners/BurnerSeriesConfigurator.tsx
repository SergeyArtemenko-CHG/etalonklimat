"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductImage from "@/components/ProductImage";
import ProductPriceDisplay from "@/components/ProductPriceDisplay";
import type { BurnerModel, BurnerSeries } from "@/lib/burners-catalog";
import {
  formatBurnerPower,
  getBurnerModel,
  leakControlLabel,
  tubeLengthLabel,
} from "@/lib/burners-catalog";
import { buildProductImageAlt } from "@/lib/product-url";

type Props = {
  series: BurnerSeries;
  initialSku?: string;
};

type Filters = {
  ramp: string;
  tubeLength: string;
  leakControl: string;
};

function modelMatches(m: BurnerModel, f: Filters): boolean {
  if (f.ramp && m.ramp !== f.ramp) return false;
  if (f.tubeLength && m.tubeLength !== f.tubeLength) return false;
  if (f.leakControl === "1" && !m.leakControl) return false;
  if (f.leakControl === "0" && m.leakControl) return false;
  return true;
}

export default function BurnerSeriesConfigurator({
  series,
  initialSku,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skuFromUrl = searchParams.get("sku")?.trim() || initialSku;
  const { data: session } = useSession();
  const rawStatus = (session?.user as { status?: number } | undefined)?.status;
  const isAuthorized = Number.isFinite(rawStatus);
  const cardRef = useRef<HTMLDivElement>(null);

  const boot = getBurnerModel(series, skuFromUrl) ?? series.models[0];
  const [selectedSku, setSelectedSku] = useState(boot?.sku ?? "");
  const [filters, setFilters] = useState<Filters>({
    ramp: "",
    tubeLength: "",
    leakControl: "",
  });

  const selected = useMemo(
    () => getBurnerModel(series, selectedSku) ?? series.models[0],
    [series, selectedSku]
  );

  const applyModel = useCallback(
    (model: BurnerModel, opts?: { scroll?: boolean }) => {
      setSelectedSku(model.sku);
      router.replace(`${series.path}?sku=${encodeURIComponent(model.sku)}`, {
        scroll: false,
      });
      if (opts?.scroll) {
        requestAnimationFrame(() => {
          cardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    },
    [router, series.path]
  );

  // Синхронизация с ?sku= (поиск в шапке, SSR-ссылки, client navigation)
  useEffect(() => {
    if (!skuFromUrl || skuFromUrl === selectedSku) return;
    const model = getBurnerModel(series, skuFromUrl);
    if (model) setSelectedSku(model.sku);
  }, [skuFromUrl, series, selectedSku]);

  // Фильтры только скрывают строки SSR-таблицы — DOM не удаляется
  useEffect(() => {
    for (const m of series.models) {
      const row = document.getElementById(`burner-mod-${m.sku}`);
      if (!row) continue;
      const match = modelMatches(m, filters);
      row.classList.toggle("hidden", !match);
      row.classList.toggle("bg-accent/5", m.sku === selectedSku);
    }
  }, [filters, series.models, selectedSku]);

  // Клик по строке SSR-таблицы (делегирование)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a[data-burner-sku]") as HTMLAnchorElement | null;
      if (!link) return;
      const sku = link.getAttribute("data-burner-sku");
      if (!sku) return;
      const model = getBurnerModel(series, sku);
      if (!model) return;
      e.preventDefault();
      applyModel(model, { scroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [series, applyModel]);

  const visibleCount = useMemo(
    () => series.models.filter((m) => modelMatches(m, filters)).length,
    [series.models, filters]
  );

  const showPrice =
    (selected?.priceRub != null && selected.priceRub > 0) ||
    (selected?.priceEur != null && selected.priceEur > 0);

  return (
    <div ref={cardRef} className="scroll-mt-24">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
        <section className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm md:p-5">
          <h2 className="mb-3 text-base font-semibold text-primary md:text-lg">
            Параметры модификации
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Газовая рампа
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.ramp}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, ramp: e.target.value }))
                }
              >
                <option value="">Любая</option>
                {series.filters.ramp.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Длина трубы
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.tubeLength}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, tubeLength: e.target.value }))
                }
              >
                <option value="">Любая</option>
                {series.filters.tubeLength.map((t) => (
                  <option key={t} value={t}>
                    {tubeLengthLabel(t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Контроль герметичности
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.leakControl}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, leakControl: e.target.value }))
                }
              >
                <option value="">Любой</option>
                {series.filters.leakControl.includes(true) ? (
                  <option value="1">{leakControlLabel(true)}</option>
                ) : null}
                {series.filters.leakControl.includes(false) ? (
                  <option value="0">{leakControlLabel(false)}</option>
                ) : null}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Показано {visibleCount} из {series.modelCount}. Полная таблица ниже
            всегда присутствует в HTML страницы.
          </p>
        </section>

        <aside className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm md:p-5">
          <div className="mb-4 overflow-hidden rounded-lg border border-text-muted/15 bg-main-bg">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm">
              <ProductImage
                key={selectedSku}
                src={selected?.image || series.image || undefined}
                alt={buildProductImageAlt({
                  name: selected?.name || series.series,
                  sku: selectedSku,
                })}
                productKey={selectedSku || series.slug}
                slug={series.slug}
                className="h-full w-full object-contain p-3"
                priority
              />
            </div>
          </div>
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Выбранная модификация
          </p>
          <h3 className="mt-1 text-lg font-semibold text-primary">
            {selected?.name || series.series}
          </h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Артикул</dt>
              <dd className="font-semibold text-text-main">{selectedSku || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Рампа</dt>
              <dd className="font-medium text-text-main">
                {selected?.ramp || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Труба</dt>
              <dd className="font-medium text-text-main">
                {tubeLengthLabel(selected?.tubeLength || "")}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Герметичность</dt>
              <dd className="font-medium text-text-main">
                {leakControlLabel(Boolean(selected?.leakControl))}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Мощность</dt>
              <dd className="font-medium text-text-main">
                {formatBurnerPower(selected?.powerMin, selected?.powerMax)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Наличие</dt>
              <dd
                className={`font-semibold ${
                  selected?.inStock ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {selected?.inStock ? "В наличии" : "Под заказ"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-2xl font-bold text-primary">
            {showPrice ? (
              <ProductPriceDisplay
                priceEur={selected?.priceEur ?? undefined}
                priceRub={selected?.priceRub ?? undefined}
              />
            ) : (
              "Цена по запросу"
            )}
          </p>
          {showPrice ? (
            <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-text-muted">
              {!isAuthorized ? "Цена без скидки с НДС" : "Цена с НДС"}
            </span>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
