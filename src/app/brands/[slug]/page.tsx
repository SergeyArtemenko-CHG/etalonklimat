import BrandFbrIntro from "@/components/BrandFbrIntro";
import ContentLayout from "@/components/ContentLayout";
import BrandPageCatalog from "@/components/BrandPageCatalog";
import {
  featuredBrands,
  getFeaturedBrandBySlug,
  type FeaturedBrand,
} from "@/data/brands";
import { products } from "@/data/products";
import { productBrandMatchesFeatured } from "@/lib/featured-brand-products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

function brandPageHeading(brand: FeaturedBrand) {
  const h = brand.heading.trim();
  return h || brand.name;
}

export function generateStaticParams() {
  return featuredBrands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "fbr") {
    return {
      title: "Купить промышленные горелки FBR: цены в интернет-магазине ЭТАЛОН",
      description:
        "Предлагаем купить оригинальные горелки FBR (газовые, дизельные, комбинированные) по выгодным ценам в Москве. Подбор оборудования под ваши задачи, всё в наличии!",
    };
  }

  const brand = getFeaturedBrandBySlug(slug);
  if (!brand) {
    return { title: "Бренд — Эталон Профи" };
  }

  const plain = brand.description.replace(/\s+/g, " ").trim();
  const description =
    plain.length > 160 ? `${plain.slice(0, 157)}…` : plain || undefined;
  return {
    title: `${brandPageHeading(brand)} — Эталон Профи`,
    description,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = getFeaturedBrandBySlug(slug);
  if (!brand) notFound();

  const pageTitle =
    slug === "fbr"
      ? "Газовые, дизельные и комбинированные горелки FBR"
      : brandPageHeading(brand);

  const paragraphs = brand.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const brandProducts = products.filter((p) =>
    productBrandMatchesFeatured(p.brand, brand)
  );

  const presetBrandKeys = Array.from(
    new Set(
      brandProducts.map((p) => (p.brand ?? "").trim()).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "ru"));

  return (
    <ContentLayout
      title={pageTitle}
      afterCard={
        <section
          className="border-t border-text-muted/20 pt-8"
          aria-labelledby="brand-catalog-heading"
        >
          <h2
            id="brand-catalog-heading"
            className="mb-4 text-lg font-semibold text-primary md:text-xl"
          >
            Товары бренда {brand.name}
          </h2>
          {brandProducts.length > 0 ? (
            <BrandPageCatalog
              slug={brand.slug}
              products={brandProducts}
              presetBrandKeys={presetBrandKeys}
            />
          ) : (
            <p className="text-sm text-text-muted">
              В каталоге пока нет позиций с брендом «{brand.name}» в
              номенклатуре.
            </p>
          )}
        </section>
      }
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex items-center justify-center rounded-xl border border-text-muted/25 bg-main-bg px-4 py-3 md:min-w-[220px]">
          <img
            src={brand.logo}
            alt={brand.name}
            className="max-h-14 w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-text-main">
          {brand.slug === "fbr" ? (
            <BrandFbrIntro />
          ) : paragraphs.length > 0 ? (
            paragraphs.map((block, i) => (
              <p key={i} className="whitespace-pre-line">
                {block}
              </p>
            ))
          ) : (
            <p>Описание скоро появится.</p>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
