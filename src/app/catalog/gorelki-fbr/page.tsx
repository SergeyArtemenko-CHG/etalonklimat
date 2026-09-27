import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  formatBurnerPower,
  getAllBurnerSeries,
} from "@/lib/burners-catalog";
import { buildCanonicalUrl } from "@/lib/site-url";
import { formatPrice } from "@/utils/currency";

export const revalidate = false;

const PATH = "/catalog/gorelki-fbr";

export const metadata: Metadata = {
  title: "Горелки FBR — серии и модификации · Эталон Профи",
  description:
    "Каталог серий горелок FBR: одна страница на серию вместо сотен дублей. Выбор рампы, длины трубы TC/TL и контроля герметичности CT.",
  alternates: { canonical: buildCanonicalUrl(PATH) },
};

export default function FbrBurnersHubPage() {
  const series = getAllBurnerSeries();

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
            href="/category/gorelki-dlya-kotlov-otopleniya"
            className="hover:text-primary"
          >
            Горелки
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-primary">FBR</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-primary md:text-3xl">
            Горелки FBR — серии
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
            {series.length} серий, склейка модификаций по рампе, длине трубы и
            контролю герметичности. Откройте серию — все варианты в одной
            таблице.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => {
            const hasPrice =
              (s.priceMin != null && s.priceMin > 0) ||
              (s.priceEurMin != null && s.priceEurMin > 0);
            return (
              <Link
                key={s.slug}
                href={s.path}
                className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm transition hover:border-accent hover:shadow-md"
              >
                <p className="font-semibold text-primary">{s.series}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {s.modelCount} мод.
                  {hasPrice
                    ? ` · от ${formatPrice(
                        s.priceEurMin ?? undefined,
                        s.priceMin ?? undefined
                      )}`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-text-main">
                  {formatBurnerPower(s.powerMin, s.powerMax)}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
