import type { Product } from "@/data/products";

const NO_IMAGE_PATH = "/images/products/no-image.webp";

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

export function productImageAlt(name: string): string {
  const trimmed = name.trim();
  return trimmed || "Промышленное оборудование";
}

/** Уникальный URL заглушки для роботов (один файл в public) */
export function getProductPlaceholderImageUrl(productKey: string): string {
  const key = encodeURIComponent(productKey.trim() || "item");
  return `${NO_IMAGE_PATH}?prod=${key}`;
}

export function resolveProductImageSrc(
  image: string | undefined,
  productKey: string,
  usePlaceholder: boolean
): string {
  if (usePlaceholder) return getProductPlaceholderImageUrl(productKey);
  const raw = image?.trim();
  if (!raw || raw.endsWith("no-image.webp")) {
    return getProductPlaceholderImageUrl(productKey);
  }
  return raw;
}

export { NO_IMAGE_PATH };
