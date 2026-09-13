"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductImage from "@/components/ProductImage";
import type { PumpModel, PumpSeries } from "@/lib/pumps-catalog";
import { formatPumpNum, getPumpModel } from "@/lib/pumps-catalog";
import { formatPrice } from "@/utils/currency";
import { buildProductImageAlt } from "@/lib/product-url";

type Props = {
  series: PumpSeries;
  initialSku?: string;
};

type Filters = {
  head: number | null;
  flow: number | null;
  power: number | null;
};

function modelMatches(m: PumpModel, f: Filters): boolean {
  if (f.head != null && m.headM != null && m.headM !== f.head) return false;
  if (f.flow != null && m.flowM3h != null && m.flowM3h !== f.flow) return false;
  if (f.power != null && m.powerKw != null && m.powerKw !== f.power) return false;
  return true;
}

function filtersFromModel(m: PumpModel | undefined): Filters {
  return {
    head: m?.headM ?? null,
    flow: m?.flowM3h ?? null,
    power: m?.powerKw ?? null,
  };
}

export default function PumpSeriesConfigurator({ series, initialSku }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const rawStatus = (session?.user as { status?: number } | undefined)?.status;
  const isAuthorized = Number.isFinite(rawStatus);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastUrlSku = useRef<string | null>(null);

  const firstModel = series.models[0];
  const bootModel = getPumpModel(series, initialSku) ?? firstModel;

  const [selectedSku, setSelectedSku] = useState<string>(
    bootModel?.sku ?? ""
  );
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromModel(bootModel)
  );

  const selected = useMemo(() => {
    return (
      getPumpModel(series, selectedSku) ??
      series.models.find((m) => m.sku === selectedSku) ??
      firstModel
    );
  }, [series, selectedSku, firstModel]);

  const applyModel = useCallback(
    (model: PumpModel, opts?: { scroll?: boolean }) => {
      // Сначала артикул — источник правды для правой колонки
      setSelectedSku(model.sku);
      setFilters(filtersFromModel(model));
      lastUrlSku.current = model.sku;
      const url = `${series.path}?sku=${encodeURIComponent(model.sku)}`;
      router.replace(url, { scroll: false });
      if (opts?.scroll) {
        // После paint, чтобы пользователь видел обновлённую карточку
        requestAnimationFrame(() => {
          cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    },
    [router, series.path]
  );

  // Синхронизация только при внешнем изменении ?sku= (не при нашем replace)
  useEffect(() => {
    if (!initialSku) return;
    if (initialSku === selectedSku) return;
    if (initialSku === lastUrlSku.current) return;
    const model = getPumpModel(series, initialSku);
    if (!model) return;
    setSelectedSku(model.sku);
    setFilters(filtersFromModel(model));
    lastUrlSku.current = model.sku;
  }, [initialSku, series, selectedSku]);

  const candidates = useMemo(() => {
    return series.models.filter((m) => modelMatches(m, filters));
  }, [series.models, filters]);

  const setFilterField = useCallback(
    (key: keyof Filters, value: number | null) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        const nextCandidates = series.models.filter((m) =>
          modelMatches(m, next)
        );
        const stillOk = nextCandidates.some((c) => c.sku === selectedSku);
        if (!stillOk && nextCandidates[0]) {
          queueMicrotask(() => {
            setSelectedSku(nextCandidates[0].sku);
            lastUrlSku.current = nextCandidates[0].sku;
            router.replace(
              `${series.path}?sku=${encodeURIComponent(nextCandidates[0].sku)}`,
              { scroll: false }
            );
          });
        }
        return next;
      });
    },
    [series.models, series.path, selectedSku, router]
  );

  const availableHeads = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, { ...filters, head: null })
    );
    return Array.from(
      new Set(pool.map((m) => m.headM).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, filters]);

  const availableFlows = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, { ...filters, flow: null })
    );
    return Array.from(
      new Set(pool.map((m) => m.flowM3h).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, filters]);

  const availablePowers = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, { ...filters, power: null })
    );
    return Array.from(
      new Set(pool.map((m) => m.powerKw).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, filters]);

  const priceLabel =
    selected?.priceRub != null && selected.priceRub > 0
      ? formatPrice(undefined, selected.priceRub)
      : "Цена по запросу";

  const showPrice = selected?.priceRub != null && selected.priceRub > 0;
  const inStock = selected?.inStock === true;
  const imageSrc = selected?.image?.trim() || "";
  const imageAlt = buildProductImageAlt({
    name: selected?.name || series.series,
    sku: selected?.sku || "",
  });

  return (
    <div ref={cardRef} className="scroll-mt-24">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
        <section className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm md:p-5">
          <h2 className="mb-3 text-base font-semibold text-primary md:text-lg">
            Выберите параметры
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Напор (м)
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.head ?? ""}
                onChange={(e) =>
                  setFilterField(
                    "head",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Любой</option>
                {availableHeads.map((v) => (
                  <option key={v} value={v}>
                    {formatPumpNum(v)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Расход (м³/ч)
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.flow ?? ""}
                onChange={(e) =>
                  setFilterField(
                    "flow",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Любой</option>
                {availableFlows.map((v) => (
                  <option key={v} value={v}>
                    {formatPumpNum(v)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-text-main">
                Мощность (кВт)
              </span>
              <select
                className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={filters.power ?? ""}
                onChange={(e) =>
                  setFilterField(
                    "power",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Любая</option>
                {availablePowers.map((v) => (
                  <option key={v} value={v}>
                    {formatPumpNum(v)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {candidates.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-text-main">
                Подходящие модификации ({candidates.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((m) => {
                  const active = selectedSku === m.sku;
                  return (
                    <button
                      key={m.sku}
                      type="button"
                      onClick={() => applyModel(m)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-text-muted/30 bg-white text-text-main hover:border-accent hover:text-accent"
                      }`}
                    >
                      {m.name || m.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!candidates.length && (
            <p className="mt-3 text-sm text-text-muted">
              Нет моделей с такой комбинацией параметров. Сбросьте один из
              фильтров.
            </p>
          )}
        </section>

        <aside className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm md:p-5">
          <div className="mb-4 overflow-hidden rounded-lg border border-text-muted/15 bg-main-bg">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm">
              <ProductImage
                key={selectedSku}
                src={imageSrc || undefined}
                alt={imageAlt}
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
              <dd className="font-semibold text-text-main" data-sku={selectedSku}>
                {selectedSku || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Наличие</dt>
              <dd
                className={`font-semibold ${
                  inStock ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {inStock ? "В наличии" : "Под заказ"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Напор</dt>
              <dd className="font-medium text-text-main">
                {formatPumpNum(selected?.headM)} м
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Расход</dt>
              <dd className="font-medium text-text-main">
                {formatPumpNum(selected?.flowM3h)} м³/ч
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">Мощность</dt>
              <dd className="font-medium text-text-main">
                {formatPumpNum(selected?.powerKw)} кВт
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
              <dt className="text-text-muted">DN</dt>
              <dd className="font-medium text-text-main">
                {formatPumpNum(selected?.dnMm)} мм
              </dd>
            </div>
            {selected?.polesRpm ? (
              <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
                <dt className="text-text-muted">Полюса / об/мин</dt>
                <dd className="font-medium text-text-main">
                  {selected.polesRpm}
                </dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-4 text-2xl font-bold text-primary">{priceLabel}</p>
          {showPrice ? (
            <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-text-muted">
              {!isAuthorized ? "Цена без скидки с НДС" : "Цена с НДС"}
            </span>
          ) : null}

          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            ✓ Официальная гарантия изготовителя | Доставка по всей России
          </p>
        </aside>
      </div>

      <section className="mt-5 overflow-x-auto rounded-xl border border-text-muted/20 bg-card-bg">
        <h2 className="border-b border-text-muted/15 px-4 py-3 text-base font-semibold text-primary">
          Все модификации серии {series.series}
        </h2>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-main-bg text-xs uppercase text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Артикул</th>
              <th className="px-3 py-2 font-medium">Модель</th>
              <th className="px-3 py-2 font-medium">Q, м³/ч</th>
              <th className="px-3 py-2 font-medium">H, м</th>
              <th className="px-3 py-2 font-medium">P2, кВт</th>
              <th className="px-3 py-2 font-medium">DN</th>
              <th className="px-3 py-2 font-medium">Цена, ₽</th>
              <th className="px-3 py-2 font-medium">Наличие</th>
            </tr>
          </thead>
          <tbody>
            {series.models.map((m) => {
              const active = selectedSku === m.sku;
              return (
                <tr
                  key={m.sku}
                  className={`border-t border-text-muted/10 hover:bg-main-bg/60 ${
                    active ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-text-main">
                    <button
                      type="button"
                      onClick={() => applyModel(m, { scroll: true })}
                      className={`text-left hover:text-accent ${
                        active ? "font-bold text-accent" : ""
                      }`}
                    >
                      {m.sku}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-text-main">
                    <button
                      type="button"
                      onClick={() => applyModel(m, { scroll: true })}
                      className="text-left hover:text-accent"
                    >
                      {m.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">{formatPumpNum(m.flowM3h)}</td>
                  <td className="px-3 py-2">{formatPumpNum(m.headM)}</td>
                  <td className="px-3 py-2">{formatPumpNum(m.powerKw)}</td>
                  <td className="px-3 py-2">{formatPumpNum(m.dnMm)}</td>
                  <td className="px-3 py-2">
                    {m.priceRub != null
                      ? m.priceRub.toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td
                    className={`px-3 py-2 font-medium ${
                      m.inStock ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {m.inStock ? "В наличии" : "Под заказ"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
