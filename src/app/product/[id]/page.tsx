import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";
import type { Product } from "@/data/products";
import {
  getCategoryBySlug,
  getProductById,
  products,
} from "@/data/products";
import ProductImage from "@/components/ProductImage";
import ProductPageActions from "./ProductPageActions";
import ProductPriceBlock from "./ProductPriceBlock";
import PreloadProductImage from "@/components/PreloadProductImage";

const SITE_URL = "https://etalon-klimat.ru";

/** Текст для микроразметки без HTML */
function toPlainDescription(product: Product): string {
  const raw =
    product.longDescription?.trim() ||
    product.description?.trim() ||
    product.name;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Schema.org Product (ld+json) — базовая цена из CSV (priceRub / priceEur) */
function buildProductJsonLd(product: Product, pageId: string): string {
  const url = `${SITE_URL}/product/${encodeURIComponent(pageId)}`;
  const imagePath = product.image?.trim() || "/images/products/no-image.webp";
  const imageUrl = imagePath.startsWith("http")
    ? imagePath
    : `${SITE_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;

  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url,
    availability:
      product.inStock !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/BackOrder",
  };

  if (typeof product.priceRub === "number" && product.priceRub > 0) {
    offers.priceCurrency = "RUB";
    offers.price = product.priceRub;
  } else if (typeof product.priceEur === "number" && product.priceEur > 0) {
    offers.priceCurrency = "EUR";
    offers.price = product.priceEur;
  }

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: toPlainDescription(product),
    sku: product.sku,
    image: [imageUrl],
    offers,
  };

  if (product.brand?.trim()) {
    node.brand = {
      "@type": "Brand",
      name: product.brand.trim(),
    };
  }

  return JSON.stringify(node);
}

export const revalidate = false;
export const dynamicParams = true;

export async function generateStaticParams() {
  return products
    .filter((p) => !!p.sku)
    .map((p) => ({ id: p.sku }));
}

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Метаданные по товару: данные совпадают с Nomenclature.csv (см. generate-products-from-csv → products.ts).
 * Поиск по params.id (артикул/slug) через getProductById.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return { title: "Товар не найден" };
  }

  const title = `${product.name} — Купить в ETALON KLIMAT`;
  const description = `Закажите ${product.name} с доставкой. Специальные цены для партнеров (Статус 1/2/3). В наличии на складе`;

  const imagePath =
    product.image?.trim() || "/images/products/no-image.webp";
  const ogImageUrl = imagePath.startsWith("http")
    ? imagePath
    : `${SITE_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${encodeURIComponent(id)}`,
      siteName: "ETALON KLIMAT",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const categoryMatch = getCategoryBySlug(product.categorySlug);
  const productJsonLd = buildProductJsonLd(product, id);

  return (
    <div className="min-h-screen bg-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      {product.image && <PreloadProductImage href={product.image} />}
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-6">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-[#003366]">
              Главная
            </Link>
            <span className="mx-2">/</span>
            {categoryMatch && (
              <>
                <Link
                  href={`/category/${"parentSlug" in categoryMatch ? categoryMatch.parentSlug : categoryMatch.slug}`}
                  className="hover:text-[#003366]"
                >
                  {"parentName" in categoryMatch ? categoryMatch.parentName : categoryMatch.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-[#0b1f33]">{product.name}</span>
          </nav>

          {/* Main block: image + info */}
          <div className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.1fr),minmax(360px,0.9fr)]">
            {/* Photo area */}
            <div>
              <div className="flex justify-center">
                <div className="flex aspect-[4/3] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain"
                    fallbackToPlaceholder
                  />
                </div>
              </div>
              {/* Дополнительная галерея (если появятся картинки) */}
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {/* Здесь в будущем можно отрисовывать доп. изображения */}
              </div>
            </div>

            {/* Right block: purchase panel */}
            <div className="flex flex-col rounded-xl bg-slate-50/80 p-5 shadow-md shadow-slate-200 transition-shadow hover:shadow-lg md:p-6">
              <h1 className="mb-3 text-xl font-semibold text-slate-900 md:text-2xl">
                {product.name}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 md:text-sm">
                <span>
                  Артикул:{" "}
                  <span className="font-medium text-slate-800">
                    {product.sku || "—"}
                  </span>
                </span>
                {product.brand && (
                  <span>
                    • Бренд:{" "}
                    <span className="font-medium text-slate-800">
                      {product.brand}
                    </span>
                  </span>
                )}
                <span>
                  • Наличие:{" "}
                  <span
                    className={
                      product.inStock !== false
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-amber-600"
                    }
                  >
                    {product.inStock !== false ? "В наличии" : "Под заказ"}
                  </span>
                </span>
              </div>
              <div className="mb-4 flex items-center gap-2">
                {product.inStock !== false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    В наличии на складе
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Поставка под заказ
                  </span>
                )}
              </div>
              <ProductPriceBlock
                priceEur={product.priceEur}
                priceRub={product.priceRub}
                partnerDiscount1={product.partnerDiscount1}
                partnerDiscount2={product.partnerDiscount2}
                partnerDiscount3={product.partnerDiscount3}
                leadTime={product.leadTime}
                inStock={product.inStock !== false}
              />
              <ProductPageActions
                id={product.id}
                name={product.name}
                sku={product.sku}
                image={product.image}
                priceEur={product.priceEur}
                priceRub={product.priceRub}
                inStock={product.inStock}
                leadTime={product.leadTime}
              />
            </div>
          </div>

          {/* Tabs */}
          <ProductTabs
            longDescription={product.longDescription}
            description={product.description}
            specs={product.specs}
            files={product.files}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
