/**
 * Публичный origin сайта для canonical, Open Graph, sitemap, JSON-LD.
 * Задаётся в .env как NEXT_PUBLIC_SITE_URL (без завершающего слэша).
 */
const DEFAULT_SITE_ORIGIN = "https://etalonklimat.ru";

export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_ORIGIN;
  return raw.replace(/\/+$/, "");
}
