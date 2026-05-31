/** SEO-переопределения для отдельных страниц брендов (не затираются при генерации brands.ts). */

export type BrandSeoOverride = {
  metadataTitle: string;
  metadataDescription: string;
  h1: string;
};

const FBR_SEO: BrandSeoOverride = {
  metadataTitle: "Купить промышленные горелки FBR: цены в интернет-магазине ЭТАЛОН",
  metadataDescription:
    "Предлагаем купить оригинальные горелки FBR (газовые, дизельные, комбинированные) по выгодным ценам в Москве. Подбор оборудования под ваши задачи, всё в наличии!",
  h1: "Газовые, дизельные и комбинированные горелки FBR",
};

export const BRAND_SEO_OVERRIDES: Record<string, BrandSeoOverride> = {
  fbr: FBR_SEO,
};

export function getBrandSeoOverride(slug: string): BrandSeoOverride | undefined {
  return BRAND_SEO_OVERRIDES[slug.trim().toLowerCase()];
}
