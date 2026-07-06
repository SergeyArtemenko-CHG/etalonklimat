import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";
import { getSiteOrigin } from "@/lib/site-url";

/** Сегмент URL товара: совпадает с generateStaticParams (ЧПУ slug). */
function productPathSegment(p: (typeof products)[number]): string {
  const seg = (p.slug && String(p.slug).trim()) || p.sku || p.id;
  return encodeURIComponent(seg);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/contacts`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: `${base}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories.map((sub) => ({
      url: `${base}/category/${sub.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [main, ...subs];
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${productPathSegment(p)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryEntries, ...productEntries];
}
