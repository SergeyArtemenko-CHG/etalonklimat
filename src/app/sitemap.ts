import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etalon-klimat.ru";

/** Сегмент URL товара: совпадает с generateStaticParams (id = sku). */
function productPathSegment(p: (typeof products)[number]): string {
  const seg = (p.sku && String(p.sku).trim()) || p.id;
  return encodeURIComponent(seg);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/contacts`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories.map((sub) => ({
      url: `${BASE_URL}/category/${sub.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [main, ...subs];
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${productPathSegment(p)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryEntries, ...productEntries];
}
