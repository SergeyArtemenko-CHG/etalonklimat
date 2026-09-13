import Link from "next/link";
import {
  getCrvSeriesForNav,
  getOtherPumpSeriesForNav,
  getTpvSeriesForNav,
  PUMPS_CONFIGURATOR_PATH,
  PUMPS_CRV_HUB_PATH,
  PUMPS_TPV_HUB_PATH,
} from "@/lib/pumps-nav";

/** Серверная витрина раздела «Насосы» — серии вместо тысяч карточек. */
export default function PumpsCategoryHub() {
  const crv = getCrvSeriesForNav();
  const tpv = getTpvSeriesForNav();
  const other = getOtherPumpSeriesForNav();

  return (
    <section className="rounded-2xl bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-5">
      <nav className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span className="text-primary">Насосы</span>
      </nav>

      <h1 className="mb-2 text-lg font-semibold text-primary md:text-xl">
        Насосное оборудование Vandjord
      </h1>
      <p className="mb-6 max-w-3xl text-sm text-text-muted">
        Выберите семейство или воспользуйтесь конфигуратором подбора по расходу
        и напору.
      </p>

      <Link
        href={PUMPS_CONFIGURATOR_PATH}
        className="mb-8 flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm font-medium text-accent shadow-sm transition hover:bg-accent hover:text-white"
      >
        <span>
          Насосы (конфигуратор)
          <span className="mt-0.5 block text-xs font-normal opacity-90">
            Введите требуемые Q и H — получите подходящие модели
          </span>
        </span>
      </Link>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          href={PUMPS_CRV_HUB_PATH}
          className="rounded-xl border border-text-muted/25 bg-text-muted/5 p-4 transition hover:border-accent/50 hover:bg-card-bg"
        >
          <p className="font-semibold text-primary">
            Вертикальные насосы CRV
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {crv.length} серий · многоступенчатые центробежные
          </p>
        </Link>
        <Link
          href={PUMPS_TPV_HUB_PATH}
          className="rounded-xl border border-text-muted/25 bg-text-muted/5 p-4 transition hover:border-accent/50 hover:bg-card-bg"
        >
          <p className="font-semibold text-primary">
            Циркуляционные насосы TPV
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {tpv.length} серий · ин-лайн по диаметру DN
          </p>
        </Link>
      </div>

      {other.length > 0 ? (
        <div className="border-t border-text-muted/15 pt-6">
          <h2 className="mb-3 text-base font-semibold text-primary">
            Другие серии Vandjord
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-text-muted/25 bg-text-muted/5 px-3 py-2 text-sm text-text-main transition hover:border-accent/50 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
