import type { MetadataRoute } from "next";

/**
 * Канонический домен для robots.txt (sitemap, host).
 * Без дефиса: https://etalonklimat.ru — не использовать etalon-klimat.ru.
 */
const SITE_ORIGIN = "https://etalonklimat.ru";

/**
 * Генерация /robots.txt через Metadata API Next.js.
 * Разрешает индексацию публичных страниц для всех поисковых роботов.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
