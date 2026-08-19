import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";
import { buildCanonicalUrl, buildProductCanonicalUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: buildCanonicalUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: buildCanonicalUrl("/contacts"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: buildCanonicalUrl(`/category/${cat.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories.map((sub) => ({
      url: buildCanonicalUrl(`/category/${sub.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [main, ...subs];
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: buildProductCanonicalUrl(p.slug || p.sku || p.id),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryEntries, ...productEntries];
}
