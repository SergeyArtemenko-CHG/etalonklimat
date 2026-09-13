import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PumpSeriesConfigurator from "@/components/pumps/PumpSeriesConfigurator";
import {
  buildPumpSeriesCanonicalPath,
  formatPumpNum,
  getAllPumpSeries,
  getPumpModel,
  getPumpSeriesBySlug,
} from "@/lib/pumps-catalog";
import { buildCanonicalUrl } from "@/lib/site-url";
import { buildPumpSeriesIntro } from "@/lib/pumps-nav";

export const revalidate = false;
export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sku?: string | string[] }>;
};

export async function generateStaticParams() {
  return getAllPumpSeries().map((s) => ({ slug: s.slug }));
}

function pickSku(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug.startsWith("nasosy-vandjord-")) {
    return { title: "Серия не найдена" };
  }
  const series = getPumpSeriesBySlug(slug);
  if (!series) {
    return { title: "Серия не найдена" };
  }

  const sp = await searchParams;
  const sku = pickSku(sp.sku);
  const model = getPumpModel(series, sku);
  const pathname = buildPumpSeriesCanonicalPath(series.slug);
  // SEO-склейка: любой ?sku= канонизируется на чистый URL серии
  const canonical = buildCanonicalUrl(pathname);

  const titleBase = `Насос Vandjord ${series.series}`;
  const title = model
    ? `${titleBase} — ${model.name || model.sku} · Эталон Профи`
    : `${titleBase}: характеристики и цены · Эталон Профи`;

  const description = model
    ? `Насос Vandjord ${model.name || series.series}, артикул ${model.sku}. Номинальный расход ${formatPumpNum(model.flowM3h)} м³/ч, напор ${formatPumpNum(model.headM)} м. Купить в Эталон Профи.`
    : `Серия насосов Vandjord ${series.series}: ${series.modelCount} модификаций. Подбор по напору, расходу и мощности.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PumpSeriesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  // Только насосы Vandjord; остальные товары сайта не затрагиваем
  if (!slug.startsWith("nasosy-vandjord-")) notFound();
  const series = getPumpSeriesBySlug(slug);
  if (!series) notFound();

  const sp = await searchParams;
  const initialSku = pickSku(sp.sku);

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
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
      </main>
      <Footer />
    </div>
  );
}
