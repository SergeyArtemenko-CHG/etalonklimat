import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PumpSeriesConfigurator from "@/components/pumps/PumpSeriesConfigurator";
import BurnerSeriesConfigurator from "@/components/burners/BurnerSeriesConfigurator";
import BurnerModelsTableSSR from "@/components/burners/BurnerModelsTableSSR";
import {
  buildPumpSeriesCanonicalPath,
  buildPumpSeriesSeoText,
  getAllPumpSeries,
  getPumpSeriesBySlug,
} from "@/lib/pumps-catalog";
import {
  buildBurnerSeriesCanonicalPath,
  buildBurnerSeriesSeoText,
  formatBurnerPower,
  getAllBurnerSeries,
  getBurnerSeriesBySlug,
} from "@/lib/burners-catalog";
import { buildCanonicalUrl } from "@/lib/site-url";
import { buildPumpSeriesIntro } from "@/lib/pumps-nav";
import { formatPrice } from "@/utils/currency";

export const revalidate = false;
export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sku?: string | string[] }>;
};

export async function generateStaticParams() {
  const pumps = getAllPumpSeries().map((s) => ({ slug: s.slug }));
  const burners = getAllBurnerSeries().map((s) => ({ slug: s.slug }));
  return [...pumps, ...burners];
}

function pickSku(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  if (slug.startsWith("nasosy-vandjord-")) {
    const series = getPumpSeriesBySlug(slug);
    if (!series) return { title: "Серия не найдена" };
    const canonical = buildCanonicalUrl(
      buildPumpSeriesCanonicalPath(series.slug)
    );
    const titleBase = `Насос Vandjord ${series.series}`;
    return {
      title: `${titleBase}: характеристики и цены`,
      description: `Серия насосов Vandjord ${series.series}: ${series.modelCount} модификаций.`,
      alternates: { canonical },
      openGraph: { url: canonical },
      robots: { index: true, follow: true },
    };
  }

  if (slug.startsWith("gorelki-fbr-")) {
    const series = getBurnerSeriesBySlug(slug);
    if (!series) return { title: "Серия не найдена" };
    const canonical = buildCanonicalUrl(
      buildBurnerSeriesCanonicalPath(series.slug)
    );
    const titleBase = `Горелка FBR ${series.series}`;
    return {
      title: `${titleBase}: модификации и цены`,
      description: `Серия горелок FBR ${series.series}: ${series.modelCount} модификаций по рампе, длине трубы TC/TL и контролю герметичности CT.`,
      alternates: { canonical },
      openGraph: { url: canonical },
      robots: { index: true, follow: true },
    };
  }

  return { title: "Серия не найдена" };
}

function PumpSeriesPageBody({
  slug,
  initialSku,
}: {
  slug: string;
  initialSku?: string;
}) {
  const series = getPumpSeriesBySlug(slug);
  if (!series) notFound();

  return (
    <>
      <nav className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Главная
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href="/catalog/podbor-nasosov-vandjord"
          className="hover:text-primary"
        >
          Насосы Vandjord
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-primary">{series.series}</span>
      </nav>

      <header className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Vandjord · серия
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-primary md:text-3xl">
          Насос {series.series}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
          {buildPumpSeriesIntro(
            series.series,
            series.modelCount,
            series.priceMin
          )}
        </p>
      </header>

      <PumpSeriesConfigurator series={series} initialSku={initialSku} />

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-muted">
        {buildPumpSeriesSeoText(series)}
      </p>
    </>
  );
}

function BurnerSeriesPageBody({
  slug,
  initialSku,
}: {
  slug: string;
  initialSku?: string;
}) {
  const series = getBurnerSeriesBySlug(slug);
  if (!series) notFound();

  const hasPrice =
    (series.priceMin != null && series.priceMin > 0) ||
    (series.priceEurMin != null && series.priceEurMin > 0);
  const priceFrom = hasPrice
    ? formatPrice(
        series.priceEurMin ?? undefined,
        series.priceMin ?? undefined
      )
    : null;
  const powerRange = formatBurnerPower(series.powerMin, series.powerMax);

  return (
    <>
      <nav className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Главная
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href="/category/gorelki-gazovye"
          className="hover:text-primary"
        >
          Горелки FBR
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-primary">{series.series}</span>
      </nav>

      <header className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          FBR · серия
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-primary md:text-3xl">
          Горелка FBR {series.series}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
          Газовые и промышленные горелки FBR серии {series.series}. Выберите
          модель газовой рампы, длину трубы (TC/TL) и наличие контроля
          герметичности (CT). В каталоге {series.modelCount} модификаций
          {powerRange !== "—" ? `, мощность ${powerRange}` : ""}
          {priceFrom ? `, цены от ${priceFrom}` : ""}.
        </p>
      </header>

      <Suspense fallback={null}>
        <BurnerSeriesConfigurator series={series} initialSku={initialSku} />
      </Suspense>

      {/* Полная таблица в исходном HTML (Server Component) — для Яндекса */}
      <BurnerModelsTableSSR series={series} />

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-muted">
        {buildBurnerSeriesSeoText(series)}
      </p>
    </>
  );
}

export default async function CatalogSeriesPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialSku = pickSku(sp.sku);

  const isPump = slug.startsWith("nasosy-vandjord-");
  const isBurner = slug.startsWith("gorelki-fbr-");
  if (!isPump && !isBurner) notFound();

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {isPump ? (
          <PumpSeriesPageBody slug={slug} initialSku={initialSku} />
        ) : (
          <BurnerSeriesPageBody slug={slug} initialSku={initialSku} />
        )}
      </main>
      <Footer />
    </div>
  );
}
