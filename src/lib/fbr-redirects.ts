/**
 * Полный маппинг старых URL карточек FBR → страница серии (?sku=).
 * Дерево CSV + ЧПУ из products.ts.
 */

import { products } from "@/data/products";
import {
  getBurnerSeriesHrefWithSku,
  getFbrLegacyProductRedirect as getFbrRedirectFromTree,
  isFbrBurnerSku,
} from "@/lib/burners-catalog";

const productsSlugRedirects = new Map<string, string>();

function add(key: string | undefined | null, href: string) {
  const k = (key || "").trim();
  if (!k) return;
  productsSlugRedirects.set(k, href);
  productsSlugRedirects.set(k.toLowerCase(), href);
}

for (const p of products) {
  if (!isFbrBurnerSku(p.sku)) continue;
  const href = getBurnerSeriesHrefWithSku(p.sku);
  if (!href) continue;
  add(p.slug, href);
  add(p.sku, href);
  add(p.id, href);
}

/**
 * Цель 301 для `/product/{slug}` горелки FBR.
 * Сначала дерево серий, затем slug/id из products.ts.
 */
export function getFbrLegacyProductRedirect(
  slugOrSku: string | undefined | null
): string | null {
  const key = (slugOrSku || "").trim();
  if (!key) return null;
  return (
    getFbrRedirectFromTree(key) ??
    productsSlugRedirects.get(key) ??
    productsSlugRedirects.get(key.toLowerCase()) ??
    null
  );
}
