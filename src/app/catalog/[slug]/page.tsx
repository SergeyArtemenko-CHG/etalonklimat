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
              {series.models.map((m) => (
                <tr
                  key={m.sku}
                  className="border-t border-text-muted/10 hover:bg-main-bg/60"
                >
                  <td className="px-3 py-2 font-medium text-text-main">
                    <Link
                      href={`${series.path}?sku=${encodeURIComponent(m.sku)}`}
                      className="hover:text-accent"
                    >
                      {m.sku}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-text-main">{m.name}</td>
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
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </div>
  );
}
