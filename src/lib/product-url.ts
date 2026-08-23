import type { Product } from "@/data/products";

const NO_IMAGE_PATH = "/images/products/no-image.webp";
const IMAGE_ALT_STORE_SUFFIX = ", купить в интернет-магазине ЭТАЛОН";

const TRANSLIT_MAP: Record<string, string> = {
  А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
  Д: "D", д: "d", Е: "E", е: "e", Ё: "E", ё: "e", Ж: "Zh", ж: "zh",
  З: "Z", з: "z", И: "I", и: "i", Й: "I", й: "i", К: "K", к: "k",
  Л: "L", л: "l", М: "M", м: "m", Н: "N", н: "n", О: "O", о: "o",
  П: "P", п: "p", Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t",
  У: "U", у: "u", Ф: "F", ф: "f", Х: "Kh", х: "kh", Ц: "Ts", ц: "ts",
  Ч: "Ch", ч: "ch", Ш: "Sh", ш: "sh", Щ: "Shch", щ: "shch", Ы: "Y", ы: "y",
  Э: "E", э: "e", Ю: "Yu", ю: "yu", Я: "Ya", я: "ya", Ь: "", ь: "", Ъ: "", ъ: "",
};

export type ProductImageSeoSource = Pick<Product, "name" | "sku" | "slug"> | {
  name: string;
  sku: string;
  slug?: string;
};

export function translitProductText(str: string): string {
  return Array.from(str)
    .map((ch) => TRANSLIT_MAP[ch] ?? ch)
    .join("");
}

/** ЧПУ из названия: «Горелка газовая FBR GAS 1» → gorelka-gazovaya-fbr-gas-1 */
export function slugifyProductName(name: string): string {
  const t = translitProductText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return t || "item";
}

type ProductPathSource = Pick<Product, "id" | "sku" | "name" | "slug">;

export function getProductSlug(product: ProductPathSource): string {
  const slug = product.slug?.trim();
  if (slug) return slug;
  const fromSku = product.sku?.trim();
  if (fromSku) return fromSku;
  return slugifyProductName(product.name) || product.id;
}

export function getProductHref(product: ProductPathSource): string {
  return `/product/${encodeURIComponent(getProductSlug(product))}`;
}

/** Уникальный ключ картинки: SKU → slug → транслит названия. */
export function getProductImageVersionKey(source: ProductImageSeoSource): string {
  const sku = (source.sku || "").trim();
  if (sku) return sku;
  const slug = (source.slug || "").trim();
  if (slug) return slug;
  return slugifyProductName(source.name) || "item";
}

/**
 * Уникальный alt для SEO:
 * «Горелка газовая FBR GAS XP 60 — артикул EK-01234, купить в интернет-магазине ЭТАЛОН»
 */
export function buildProductImageAlt(source: ProductImageSeoSource): string {
  const name = (source.name || "").trim();
  const sku = (source.sku || "").trim();

  if (name && sku) {
    return `${name} — артикул ${sku}${IMAGE_ALT_STORE_SUFFIX}`;
  }
  if (name) {
    return `${name}${IMAGE_ALT_STORE_SUFFIX}`;
  }
  return `Промышленное оборудование${IMAGE_ALT_STORE_SUFFIX}`;
}

/** @deprecated Используйте buildProductImageAlt({ name, sku }) */
export function productImageAlt(name: string, sku?: string): string {
  return buildProductImageAlt({ name, sku: sku || "" });
}

/** Уникальный URL заглушки для роботов (один файл в public). */
export function getProductPlaceholderImageUrl(productKey: string): string {
  const key = encodeURIComponent(productKey.trim() || "item");
  return `${NO_IMAGE_PATH}?prod=${key}`;
}

/**
 * SEO-маскировка: один физический файл — разный URL для каждой модели (?v=SKU).
 */
export function appendProductImageVersion(src: string, productKey: string): string {
  const raw = (src || "").trim();
  if (!raw || raw.startsWith("data:")) return raw;

  const key = encodeURIComponent((productKey || "item").trim());
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  params.set("v", key);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function resolveProductImageSeoSrc(
  image: string | undefined,
  source: ProductImageSeoSource,
  usePlaceholder: boolean
): string {
  const versionKey = getProductImageVersionKey(source);

  if (usePlaceholder) {
    return getProductPlaceholderImageUrl(versionKey);
  }

  const raw = image?.trim();
  if (!raw || raw.endsWith("no-image.webp")) {
    return getProductPlaceholderImageUrl(versionKey);
  }

  return appendProductImageVersion(raw, versionKey);
}

/** Абсолютный URL картинки для Open Graph / JSON-LD. */
export function resolveProductImageSeoAbsoluteUrl(
  image: string | undefined,
  source: ProductImageSeoSource,
  siteOrigin: string
): string {
  const hasImage =
    !!image?.trim() && !image.trim().endsWith("no-image.webp");
  const relative = resolveProductImageSeoSrc(image, source, !hasImage);
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  return `${siteOrigin}${relative.startsWith("/") ? relative : `/${relative}`}`;
}

/** @deprecated Используйте resolveProductImageSeoSrc */
export function resolveProductImageSrc(
  image: string | undefined,
  productKey: string,
  usePlaceholder: boolean
): string {
  return resolveProductImageSeoSrc(
    image,
    { name: "", sku: productKey },
    usePlaceholder
  );
}

export { NO_IMAGE_PATH };
