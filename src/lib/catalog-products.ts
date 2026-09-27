/**
 * Каталоговые выборки с оверлеем актуальных цен/наличия FBR
 * из burners_catalog_tree (CSV).
 */

import {
  getProductsByCategory as getProductsByCategoryRaw,
  getProductBySlug as getProductBySlugRaw,
  type Product,
} from "@/data/products";
import {
  withFbrCatalogOverlay,
  withFbrCatalogOverlayAll,
} from "@/lib/burners-catalog";

export function getProductsByCategory(slug: string): Product[] {
  return withFbrCatalogOverlayAll(getProductsByCategoryRaw(slug));
}

export function getProductBySlug(slug: string): Product | undefined {
  const product = getProductBySlugRaw(slug);
  return product ? withFbrCatalogOverlay(product) : undefined;
}

export { withFbrCatalogOverlay, withFbrCatalogOverlayAll };
