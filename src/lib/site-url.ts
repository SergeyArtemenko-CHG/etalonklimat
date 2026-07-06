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

/** Номер страницы из ?page= (по умолчанию 1). */
export function parseCatalogPageParam(
  page: string | string[] | undefined
): number {
  const raw = Array.isArray(page) ? page[0] : page;
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Canonical URL: pathname с опциональной пагинацией ?page=N (N > 1). */
export function buildCanonicalUrl(pathname: string, page = 1): string {
  const site = getSiteOrigin();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return page > 1 ? `${site}${path}?page=${page}` : `${site}${path}`;
}
