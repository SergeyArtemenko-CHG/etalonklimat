import type { BurnerSeries } from "@/lib/burners-catalog";
import {
  formatBurnerPower,
  tubeLengthLabel,
} from "@/lib/burners-catalog";
import { formatPrice } from "@/utils/currency";

/**
 * Серверная таблица всех модификаций — попадает в исходный HTML без JS.
 */
export default function BurnerModelsTableSSR({
  series,
}: {
  series: BurnerSeries;
}) {
  return (
    <section className="mt-5 overflow-x-auto rounded-xl border border-text-muted/20 bg-card-bg">
      <h2 className="border-b border-text-muted/15 px-4 py-3 text-base font-semibold text-primary">
        Все модификации серии {series.series}
      </h2>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-main-bg text-xs uppercase text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Артикул</th>
            <th className="px-3 py-2 font-medium">Модель</th>
            <th className="px-3 py-2 font-medium">Рампа</th>
            <th className="px-3 py-2 font-medium">Труба</th>
            <th className="px-3 py-2 font-medium">CT</th>
            <th className="px-3 py-2 font-medium">Мощность</th>
            <th className="px-3 py-2 font-medium">Цена, ₽</th>
            <th className="px-3 py-2 font-medium">Наличие</th>
          </tr>
        </thead>
        <tbody>
          {series.models.map((m) => {
            const hasPrice =
              (m.priceRub != null && m.priceRub > 0) ||
              (m.priceEur != null && m.priceEur > 0);
            return (
              <tr
                key={m.sku}
                id={`burner-mod-${m.sku}`}
                className="border-t border-text-muted/10"
              >
                <td className="px-3 py-2 font-medium text-text-main">
                  <a
                    href={`${series.path}?sku=${encodeURIComponent(m.sku)}`}
                    data-burner-sku={m.sku}
                    className="hover:text-accent"
                  >
                    {m.sku}
                  </a>
                </td>
                <td className="px-3 py-2 text-text-main">{m.name}</td>
                <td className="px-3 py-2">{m.ramp || "—"}</td>
                <td className="px-3 py-2">{tubeLengthLabel(m.tubeLength)}</td>
                <td className="px-3 py-2">{m.leakControl ? "CT" : "—"}</td>
                <td className="px-3 py-2">
                  {formatBurnerPower(m.powerMin, m.powerMax)}
                </td>
                <td className="px-3 py-2">
                  {hasPrice
                    ? formatPrice(
                        m.priceEur ?? undefined,
                        m.priceRub ?? undefined
                      )
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  {m.inStock ? "В наличии" : "Под заказ"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
