"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PumpModel, PumpSeries } from "@/lib/pumps-catalog";
import { formatPumpNum, getPumpModel } from "@/lib/pumps-catalog";
import { formatPrice } from "@/utils/currency";

type Props = {
  series: PumpSeries;
  initialSku?: string;
};

function modelMatches(
  m: PumpModel,
  head: number | null,
  flow: number | null,
  power: number | null
): boolean {
  if (head != null && m.headM != null && m.headM !== head) return false;
  if (flow != null && m.flowM3h != null && m.flowM3h !== flow) return false;
  if (power != null && m.powerKw != null && m.powerKw !== power) return false;
  return true;
}

export default function PumpSeriesConfigurator({ series, initialSku }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const rawStatus = (session?.user as { status?: number } | undefined)?.status;
  const isAuthorized = Number.isFinite(rawStatus);

  const initial = useMemo(() => {
    return getPumpModel(series, initialSku) ?? series.models[0];
  }, [series, initialSku]);

  const [head, setHead] = useState<number | null>(initial?.headM ?? null);
  const [flow, setFlow] = useState<number | null>(initial?.flowM3h ?? null);
  const [power, setPower] = useState<number | null>(initial?.powerKw ?? null);
  const [selected, setSelected] = useState<PumpModel | undefined>(initial);

  const candidates = useMemo(() => {
    return series.models.filter((m) => modelMatches(m, head, flow, power));
  }, [series.models, head, flow, power]);

  useEffect(() => {
    if (!candidates.length) return;
    const stillOk = selected && candidates.some((c) => c.sku === selected.sku);
    if (!stillOk) {
      setSelected(candidates[0]);
    }
  }, [candidates, selected]);

  useEffect(() => {
    if (!selected) return;
    const url = `${series.path}?sku=${encodeURIComponent(selected.sku)}`;
    router.replace(url, { scroll: false });
  }, [selected, series.path, router]);

  const availableHeads = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, null, flow, power)
    );
    return Array.from(
      new Set(pool.map((m) => m.headM).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, flow, power]);

  const availableFlows = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, head, null, power)
    );
    return Array.from(
      new Set(pool.map((m) => m.flowM3h).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, head, power]);

  const availablePowers = useMemo(() => {
    const pool = series.models.filter((m) =>
      modelMatches(m, head, flow, null)
    );
    return Array.from(
      new Set(pool.map((m) => m.powerKw).filter((v): v is number => v != null))
    ).sort((a, b) => a - b);
  }, [series.models, head, flow]);

  const priceLabel =
    selected?.priceRub != null && selected.priceRub > 0
      ? formatPrice(undefined, selected.priceRub)
      : "Цена по запросу";

  const showPrice =
    selected?.priceRub != null && selected.priceRub > 0;
  const inStock = selected?.inStock === true;

  return (
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
              value={head ?? ""}
              onChange={(e) =>
                setHead(e.target.value ? Number(e.target.value) : null)
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
              value={flow ?? ""}
              onChange={(e) =>
                setFlow(e.target.value ? Number(e.target.value) : null)
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
              value={power ?? ""}
              onChange={(e) =>
                setPower(e.target.value ? Number(e.target.value) : null)
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
                const active = selected?.sku === m.sku;
                return (
                  <button
                    key={m.sku}
                    type="button"
                    onClick={() => {
                      setSelected(m);
                      setHead(m.headM);
                      setFlow(m.flowM3h);
                      setPower(m.powerKw);
                    }}
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
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Выбранная модификация
        </p>
        <h3 className="mt-1 text-lg font-semibold text-primary">
          {selected?.name || series.series}
        </h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3 border-b border-text-muted/15 pb-2">
            <dt className="text-text-muted">Артикул</dt>
            <dd className="font-semibold text-text-main">{selected?.sku ?? "—"}</dd>
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
              <dd className="font-medium text-text-main">{selected.polesRpm}</dd>
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
  );
}
