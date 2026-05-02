import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

/**
 * Генерация /robots.txt через Metadata API Next.js.
 * Разрешает индексацию публичных страниц для всех поисковых роботов.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
