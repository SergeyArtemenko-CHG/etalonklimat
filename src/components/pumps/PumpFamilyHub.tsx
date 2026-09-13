import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  formatPumpNum,
  type PumpSeries,
} from "@/lib/pumps-catalog";
import {
  getCrvSeriesDetailed,
  getTpvSeriesDetailed,
  PUMPS_CONFIGURATOR_PATH,
  PUMPS_CRV_HUB_PATH,
  PUMPS_TPV_HUB_PATH,
} from "@/lib/pumps-nav";
import { buildCanonicalUrl } from "@/lib/site-url";

type HubKind = "crv" | "tpv";

const HUB_META: Record<
  HubKind,
  {
    path: string;
    title: string;
    h1: string;
    description: string;
    getSeries: () => PumpSeries[];
  }
> = {
  crv: {
    path: PUMPS_CRV_HUB_PATH,
    title: "Вертикальные насосы CRV Vandjord · Эталон Профи",
    h1: "Вертикальные многоступенчатые насосы CRV",
    description:
      "Серии вертикальных многоступенчатых насосов Vandjord CRV для водоснабжения, отопления и повышения давления. Выберите серию по номинальному расходу.",
    getSeries: getCrvSeriesDetailed,
  },
  tpv: {
    path: PUMPS_TPV_HUB_PATH,
    title: "Циркуляционные насосы TPV Vandjord · Эталон Профи",
    h1: "Циркуляционные ин-лайн насосы TPV",
    description:
      "Серии циркуляционных ин-лайн насосов Vandjord TPV по диаметру патрубка и числу полюсов. Подбор модификации — на странице серии.",
    getSeries: getTpvSeriesDetailed,
  },
};

function SeriesTiles({ seriesList }: { seriesList: PumpSeries[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {seriesList.map((s) => (
        <Link
          key={s.slug}
          href={s.path}
          className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm transition hover:border-accent hover:shadow-md"
        >
          <p className="font-semibold text-primary">Серия {s.series}</p>
          <p className="mt-1 text-xs text-text-muted">
            {s.modelCount} модификаций
            {s.priceMin != null
              ? ` · от ${s.priceMin.toLocaleString("ru-RU")} ₽`
              : ""}
          </p>
          <p className="mt-2 text-xs text-text-main">
            H: {formatPumpNum(s.filters.headM[0])}–
            {formatPumpNum(s.filters.headM[s.filters.headM.length - 1])} м
            {" · "}
            Q: {formatPumpNum(s.filters.flowM3h[0])}–
            {formatPumpNum(s.filters.flowM3h[s.filters.flowM3h.length - 1])}{" "}
            м³/ч
          </p>
        </Link>
      ))}
    </div>
  );
}

export function buildPumpFamilyHubMetadata(kind: HubKind): Metadata {
  const meta = HUB_META[kind];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: buildCanonicalUrl(meta.path) },
  };
}

export function PumpFamilyHubPage({ kind }: { kind: HubKind }) {
  const meta = HUB_META[kind];
  const seriesList = meta.getSeries();

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <nav className="mb-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary">
            Главная
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/category/nasosy" className="hover:text-primary">
            Насосы
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-primary">
            {kind === "crv" ? "CRV" : "TPV"}
          </span>
        </nav>

        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Vandjord
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-primary md:text-3xl">
            {meta.h1}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
            {meta.description}
          </p>
        </header>

        <Link
          href={PUMPS_CONFIGURATOR_PATH}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-white"
        >
          Насосы (конфигуратор)
        </Link>

        <SeriesTiles seriesList={seriesList} />
      </main>
      <Footer />
    </div>
  );
}
