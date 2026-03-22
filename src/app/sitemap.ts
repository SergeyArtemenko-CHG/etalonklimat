import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";

/**
 * Канонический домен сайта (как в требованиях к sitemap).
 * Должен совпадать с публичным URL продакшена.
 */
const BASE = "https://etalon-klimat.ru";

/**
 * Источник номенклатуры: Nomenclature.csv (корень репозитория или data/).
 * Скрипт `node scripts/generate-products-from-csv.cjs` собирает `src/data/products.ts`.
 * Здесь мы не парсим CSV повторно — используем уже сгенерированный массив `products`,
 * чтобы билд оставался быстрым (без тяжёлого Papa.parse на тысячах строк).
 */
const CSV_CANDIDATES = [
  path.join(process.cwd(), "data", "Nomenclature.csv"),
  path.join(process.cwd(), "Nomenclature.csv"),
];

function assertCsvSourceExists(): void {
  const found = CSV_CANDIDATES.some((p) => fs.existsSync(p));
  if (!found && process.env.NODE_ENV === "development") {
    console.warn(
      "[sitemap] Nomenclature.csv не найден по путям data/Nomenclature.csv или ./Nomenclature.csv — проверьте источник данных."
    );
  }
}

/** Сегмент URL товара: совпадает с generateStaticParams (id = sku). */
function productPathSegment(p: (typeof products)[number]): string {
  const seg = (p.sku && String(p.sku).trim()) || p.id;
  return encodeURIComponent(seg);
}

export default function sitemap(): MetadataRoute.Sitemap {
  assertCsvSourceExists();

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/reviews`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/requisites`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/cart`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/agreement`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/brands/egs`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/brands/energostandart`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/brands/fbr`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((cat) => {
    const main = {
      url: `${BASE}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
    const subs = cat.subCategories.map((sub) => ({
      url: `${BASE}/category/${sub.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [main, ...subs];
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${productPathSegment(p)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryEntries, ...productEntries];
}
