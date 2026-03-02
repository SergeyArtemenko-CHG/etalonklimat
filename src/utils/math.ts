/**
 * Логарифмическая шкала для слайдера мощности.
 * Преобразует реальные кВт в позицию 0–100 и обратно.
 */

const LOG_EPS = 0.1; // минимальное значение для log, чтобы избежать log(0)

/**
 * Преобразует мощность (кВт) в позицию слайдера от 0 до 100 по логарифмической кривой.
 */
export function toLog(value: number, min: number, max: number): number {
  if (min >= max) return 0;
  const safeMin = Math.max(min, LOG_EPS);
  const safeMax = Math.max(max, safeMin + LOG_EPS);
  const safeValue = Math.max(Math.min(value, safeMax), safeMin);
  const logMin = Math.log10(safeMin);
  const logMax = Math.log10(safeMax);
  const logValue = Math.log10(safeValue);
  const position = ((logValue - logMin) / (logMax - logMin)) * 100;
  return Math.max(0, Math.min(100, position));
}

/**
 * Преобразует позицию слайдера 0–100 в мощность (кВт) по логарифмической кривой.
 */
export function fromLog(position: number, min: number, max: number): number {
  if (min >= max) return min;
  const safeMin = Math.max(min, LOG_EPS);
  const safeMax = Math.max(max, safeMin + LOG_EPS);
  const logMin = Math.log10(safeMin);
  const logMax = Math.log10(safeMax);
  const p = Math.max(0, Math.min(100, position)) / 100;
  const logValue = logMin + p * (logMax - logMin);
  const value = Math.pow(10, logValue);
  return Math.round(value * 10) / 10; // округление до 0.1 кВт
}
