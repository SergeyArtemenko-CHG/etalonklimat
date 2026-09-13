import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";
import { getAllPumpSeries, isVandjordPumpSku } from "@/lib/pumps-catalog";
import { buildCanonicalUrl, buildProductCanonicalUrl } from "@/lib/site-url";
import { LEGACY_PUMP_CATEGORY_SLUGS } from "@/lib/pumps-nav";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: buildCanonicalUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: buildCanonicalUrl("/contacts"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    {
      url: buildCanonicalUrl("/catalog/podbor-nasosov-vandjord"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: buildCanonicalUrl("/catalog/vertikalnye-nasosy-crv"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: buildCanonicalUrl("/catalog/cirkulyacionnye-nasosy-tpv"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const legacyPumpSlugs = new Set<string>(LEGACY_PUMP_CATEGORY_SLUGS);

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: buildCanonicalUrl(`/category/${cat.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories
      .filter((sub) => !legacyPumpSlugs.has(sub.slug))
      .map((sub) => ({
        url: buildCanonicalUrl(`/category/${sub.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    return [main, ...subs];
  });

  // Серии Vandjord — сильные страницы; отдельные артикулы в sitemap не кладём
  const pumpSeriesEntries: MetadataRoute.Sitemap = getAllPumpSeries().map((s) => ({
    url: buildCanonicalUrl(s.path),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => !isVandjordPumpSku(p.sku))
    .map((p) => ({
      url: buildProductCanonicalUrl(p.slug || p.sku || p.id),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...categoryEntries,
    ...pumpSeriesEntries,
    ...productEntries,
  ];
}
