import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PumpDutyFinder from "@/components/pumps/PumpDutyFinder";
import { formatPumpNum, getAllPumpSeries } from "@/lib/pumps-catalog";
import { buildCanonicalUrl } from "@/lib/site-url";

export const revalidate = false;

const PATH = "/catalog/podbor-nasosov-vandjord";

export const metadata: Metadata = {
  title: "Подбор насосов Vandjord по расходу и напору · Эталон Профи",
  description:
    "Конфигуратор насосов Vandjord: введите требуемый расход Q и напор H — подберём подходящие модели с допуском ±20% по Q и до +25% по H.",
  alternates: {
    canonical: buildCanonicalUrl(PATH),
  },
};

export default function PumpConfiguratorPage() {
  const series = getAllPumpSeries();

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <nav className="mb-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary">
            Главная
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-primary">Подбор насосов Vandjord</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-primary md:text-3xl">
            Подбор насосов Vandjord
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
            Укажите требуемый расход и напор. Система отберёт модели, у которых
            номинальный расход в пределах ±20% от запроса, а номинальный напор
            не ниже требуемого и не превышает его более чем на 25%.
          </p>
        </header>

        <PumpDutyFinder />

        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-primary">
            Все серии Vandjord ({series.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <Link
                key={s.slug}
                href={s.path}
                className="rounded-xl border border-text-muted/20 bg-card-bg p-4 shadow-sm transition hover:border-accent hover:shadow-md"
              >
                <p className="font-semibold text-primary">{s.series}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {s.modelCount} мод.
                  {s.priceMin != null
                    ? ` · от ${s.priceMin.toLocaleString("ru-RU")} ₽`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-text-main">
                  H: {formatPumpNum(s.filters.headM[0])}–
                  {formatPumpNum(s.filters.headM[s.filters.headM.length - 1])} м
                  {" · "}
                  Q: {formatPumpNum(s.filters.flowM3h[0])}–
                  {formatPumpNum(
                    s.filters.flowM3h[s.filters.flowM3h.length - 1]
                  )}{" "}
                  м³/ч
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
