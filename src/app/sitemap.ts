import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";

const BASE = "https://etma-pro.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/cart`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: `${BASE}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories.map((sub) => ({
      url: `${BASE}/category/${sub.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [main, ...subs];
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryEntries, ...productEntries];
}
