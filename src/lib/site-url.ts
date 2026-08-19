/**
 * Публичный origin сайта для canonical, Open Graph, sitemap, JSON-LD.
 * Канонический домен продакшена фиксирован: Яндекс не должен видеть
 * localhost / preview / www / http в <link rel="canonical">.
 */
export const SITE_CANONICAL_ORIGIN = "https://etalonklimat.ru";

const DEFAULT_SITE_ORIGIN = SITE_CANONICAL_ORIGIN;

export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_ORIGIN;

  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.endsWith(".vercel.app")
    ) {
      return DEFAULT_SITE_ORIGIN;
    }

    if (host === "etalonklimat.ru") {
      return SITE_CANONICAL_ORIGIN;
    }

    return `${url.protocol}//${url.host}`.replace(/\/+$/, "");
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

/** Origin для rel=canonical / OG url: всегда прод, без www, https. */
export function getCanonicalOrigin(): string {
  return SITE_CANONICAL_ORIGIN;
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Pathname без query, hash и завершающего слэша
 * (сайт работает без trailing slash).
 */
export function normalizeCanonicalPath(pathname: string): string {
  const cut = (pathname || "").split("?")[0].split("#")[0].trim();
  const decoded = safeDecodeUri(cut);
  let path = decoded.startsWith("/") ? decoded : `/${decoded}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }
  return path || "/";
}

/** Номер страницы из ?page= (по умолчанию 1). */
export function parseCatalogPageParam(
  page: string | string[] | undefined
): number {
  const raw = Array.isArray(page) ? page[0] : page;
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Абсолютный canonical URL.
 * Query-параметры (utm, yclid, spm, lightbox, фильтры) отбрасываются.
 * Для листингов можно передать page > 1 — тогда останется только ?page=N.
 */
export function buildCanonicalUrl(pathname: string, page = 1): string {
  const origin = getCanonicalOrigin();
  const path = normalizeCanonicalPath(pathname);
  const pageNum = Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
  if (pageNum > 1) return `${origin}${path}?page=${pageNum}`;
  return path === "/" ? origin : `${origin}${path}`;
}

/** Canonical карточки товара: https://etalonklimat.ru/product/{slug} */
export function buildProductCanonicalUrl(slug: string): string {
  const segment = normalizeCanonicalPath(`/product/${slug || ""}`)
    .replace(/^\/product\/?/, "")
    .replace(/^\/+|\/+$/g, "");
  return buildCanonicalUrl(`/product/${segment}`);
}
