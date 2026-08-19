import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";
import type { Product } from "@/data/products";
import {
  getCategoryBySlug,
  getProductBySlug,
  products,
} from "@/data/products";
import ProductImage from "@/components/ProductImage";
import ProductPageActions from "./ProductPageActions";
import ProductPriceBlock from "./ProductPriceBlock";
import PreloadProductImage from "@/components/PreloadProductImage";
import {
  getCanonicalOrigin,
  buildProductCanonicalUrl,
} from "@/lib/site-url";
import {
  getProductPlaceholderImageUrl,
  productImageAlt,
} from "@/lib/product-url";

function toPlainDescription(product: Product): string {
  const raw =
    product.longDescription?.trim() ||
    product.description?.trim() ||
    product.name;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncateMetaDescription(plain: string, max = 160): string {
  const s = plain.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const slice = s.slice(0, max - 1).trim();
  const lastSpace = slice.lastIndexOf(" ");
  const safe = lastSpace > 90 ? slice.slice(0, lastSpace) : slice;
  return `${safe}…`;
}

function buildProductJsonLd(product: Product, canonicalUrl: string): string {
  const site = getCanonicalOrigin();
  const url = canonicalUrl;
  const imagePath =
    product.image?.trim() || getProductPlaceholderImageUrl(product.sku);
  const imageUrl = imagePath.startsWith("http")
    ? imagePath
    : `${site}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;

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
  return products.map((p) => ({ slug: p.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Товар не найден" };
  }

  const site = getCanonicalOrigin();
  const plain = toPlainDescription(product);
  const title = `${product.name} — арт. ${product.sku} · Эталон Профи`;
  const description =
    truncateMetaDescription(plain) ||
    `${product.name}. Артикул ${product.sku}. Доставка по России; персональные цены и сроки — после входа в кабинет партнёра.`;

  const imagePath =
    product.image?.trim() || getProductPlaceholderImageUrl(product.sku);
  const ogImageUrl = imagePath.startsWith("http")
    ? imagePath
    : `${site}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;

  // Абсолютный URL текущей карточки без UTM/yclid и без trailing slash.
  const canonicalUrl = buildProductCanonicalUrl(product.slug);

  return {
    metadataBase: new URL(`${site}/`),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Эталон Профи",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          alt: productImageAlt(product.name),
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
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const categoryMatch = getCategoryBySlug(product.categorySlug);
  const canonicalUrl = buildProductCanonicalUrl(product.slug);
  const productJsonLd = buildProductJsonLd(product, canonicalUrl);

  return (
    <div className="min-h-screen bg-main-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd }}
      />
      {product.image && <PreloadProductImage href={product.image} />}
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-6">
          <nav className="mb-6 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <span className="mx-2">/</span>
            {categoryMatch && (
              <>
                <Link
                  href={`/category/${"parentSlug" in categoryMatch ? categoryMatch.parentSlug : categoryMatch.slug}`}
                  className="hover:text-primary"
                >
                  {"parentName" in categoryMatch ? categoryMatch.parentName : categoryMatch.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-primary">{product.name}</span>
          </nav>

          <div className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.1fr),minmax(360px,0.9fr)]">
            <div>
              <div className="flex justify-center">
                <div className="flex aspect-[4/3] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-lg border border-text-muted/25 bg-gradient-to-br from-main-bg to-text-muted/15 shadow-inner">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    productKey={product.sku}
                    className="h-full w-full object-contain"
                    fallbackToPlaceholder
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-xl bg-card-bg/85 p-5 shadow-md shadow-text-muted/10 md:p-6">
              <h1 className="mb-3 text-xl font-semibold text-text-main md:text-2xl">
                {product.name}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted md:text-sm">
                <span>
                  Артикул:{" "}
                  <span className="font-medium text-text-main">
                    {product.sku || "—"}
                  </span>
                </span>
                {product.brand && (
                  <span>
                    • Бренд:{" "}
                    <span className="font-medium text-text-main">
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
