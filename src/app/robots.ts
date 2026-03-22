import type { MetadataRoute } from "next";

/** Канонический домен (совпадает с sitemap.ts и metadataBase в layout.tsx) */
const BASE = "https://etalon-klimat.ru";

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
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
