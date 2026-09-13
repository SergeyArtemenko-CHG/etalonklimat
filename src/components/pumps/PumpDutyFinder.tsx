"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatPumpNum,
  matchPumpsByDuty,
  type PumpModel,
  type PumpSeries,
} from "@/lib/pumps-catalog";
import { formatPrice } from "@/utils/currency";

type Hit = { series: PumpSeries; model: PumpModel; score: number };

export default function PumpDutyFinder() {
  const [flow, setFlow] = useState("");
  const [head, setHead] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);

  const summary = useMemo(() => {
    if (!submitted) return null;
    return hits.length
      ? `Найдено моделей: ${hits.length}`
      : "Подходящих моделей не найдено. Измените Q/H.";
  }, [submitted, hits.length]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = Number(String(flow).replace(",", "."));
    const h = Number(String(head).replace(",", "."));
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(h) || h <= 0) {
      setHits([]);
      setSubmitted(true);
      return;
    }
    setHits(matchPumpsByDuty(q, h).slice(0, 48));
    setSubmitted(true);
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm md:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-text-main">
              Требуемый расход (Q), м³/ч
            </span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              required
              value={flow}
              onChange={(e) => setFlow(e.target.value)}
              placeholder="например, 3"
              className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-text-main">
              Требуемый напор (H), м
            </span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              required
              value={head}
              onChange={(e) => setHead(e.target.value)}
              placeholder="например, 24"
              className="w-full rounded-lg border border-text-muted/35 bg-white px-3 py-2.5 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Фильтр: расход ±20% от запроса; напор ≥ H и не выше H + 25%.
        </p>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
        >
          Подобрать насос
        </button>
      </form>

      {summary && (
        <p className="mt-6 text-sm font-medium text-text-main">{summary}</p>
      )}

      {hits.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hits.map(({ series, model }) => {
            const href = `${series.path}?sku=${encodeURIComponent(model.sku)}`;
            const price =
              model.priceRub != null && model.priceRub > 0
                ? formatPrice(undefined, model.priceRub)
                : "Цена по запросу";
            return (
              <article
                key={`${series.slug}-${model.sku}`}
                className="flex flex-col rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm"
              >
                <p className="text-xs text-text-muted">{series.series}</p>
                <h3 className="mt-1 text-sm font-semibold text-primary">
                  {model.name || model.sku}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Артикул: {model.sku}
                </p>
                <ul className="mt-3 space-y-1 text-xs text-text-main">
                  <li>Q: {formatPumpNum(model.flowM3h)} м³/ч</li>
                  <li>H: {formatPumpNum(model.headM)} м</li>
                  <li>P2: {formatPumpNum(model.powerKw)} кВт</li>
                  <li>DN: {formatPumpNum(model.dnMm)} мм</li>
                </ul>
                <p className="mt-3 text-base font-bold text-primary">{price}</p>
                <Link
                  href={href}
                  className="mt-auto inline-flex justify-center rounded-lg border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
                >
                  Подробнее
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
