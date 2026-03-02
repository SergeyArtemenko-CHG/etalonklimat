export const CURRENT_RUB_RATE = 100;

const CBR_DAILY_JSON = "https://www.cbr-xml-daily.ru/daily_json.js";
const FALLBACK_EUR_RATE = 105;

let cachedEurRate: number | null = null;

/** Курс EUR/RUB с API ЦБ РФ. При ошибке — запасной курс 105. Кэшируется в памяти. */
export async function getLatestEurRate(): Promise<number> {
  if (cachedEurRate !== null) {
    return cachedEurRate;
  }
  try {
    const res = await fetch(CBR_DAILY_JSON, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`CBR API: ${res.status}`);
    const data = (await res.json()) as {
      Valute?: { EUR?: { Value?: number } };
    };
    const rate = data.Valute?.EUR?.Value;
    if (typeof rate !== "number" || rate <= 0) throw new Error("Invalid EUR rate");
    cachedEurRate = rate;
    return rate;
  } catch {
    cachedEurRate = FALLBACK_EUR_RATE;
    return FALLBACK_EUR_RATE;
  }
}

export function eurToRub(eur: number, rate: number = CURRENT_RUB_RATE): number {
  return eur * rate;
}

/**
 * Форматирует цену в рублях.
 * @param priceEur — цена в евро (используется, если priceRub не задан)
 * @param priceRub — цена в рублях (если задана — возвращается без учёта курса)
 * @param currentRate — курс EUR/RUB (обязателен при использовании priceEur)
 */
export function formatPrice(
  priceEur?: number,
  priceRub?: number,
  currentRate: number = CURRENT_RUB_RATE
): string {
  const rub =
    priceRub != null && priceRub > 0
      ? priceRub
      : priceEur != null && Number.isFinite(priceEur)
        ? eurToRub(priceEur, currentRate)
        : 0;
  const rounded = Math.round(rub);
  return new Intl.NumberFormat("ru-RU").format(rounded) + " ₽";
}

