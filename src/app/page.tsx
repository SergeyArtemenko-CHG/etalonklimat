import Link from "next/link";
import Header from "@/components/Header";
import HomeHero from "@/components/HomeHero";
import HomeLeadCta from "@/components/HomeLeadCta";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { featuredBrands, type FeaturedBrand } from "@/data/brands";
import { categories, products } from "@/data/products";
import { productBrandMatchesFeatured } from "@/lib/featured-brand-products";

/** Типы товаров бренда: подкатегории, иначе категории */
function brandProductTypes(brand: FeaturedBrand): string {
  const names = new Set<string>();
  for (const p of products) {
    if (!productBrandMatchesFeatured(p.brand, brand)) continue;
    const cat = categories.find((c) => c.slug === p.categorySlug);
    const sub = cat?.subCategories?.find((s) => s.slug === p.subCategorySlug);
    if (sub?.name) names.add(sub.name);
    else if (cat?.name) names.add(cat.name);
  }
  return [...names].join(". ");
}

export default function Home() {
  const popularProducts = products.filter((p) => p.popular === true).slice(0, 8);

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main>
        <HomeHero />

        {/* Brands — стиль карточек как santech.ru/main/brands */}
        {featuredBrands.length > 0 ? (
          <section
            className="bg-[#f8f9fa] pb-8 pt-8 md:pb-10 md:pt-10"
            aria-label="Бренды"
          >
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-y-8 md:gap-x-16">
                {featuredBrands.slice(0, 5).map((brand, i, arr) => {
                  const copy = brandProductTypes(brand);
                  if (!copy) return null;
                  const centerLast =
                    i === arr.length - 1 && arr.length % 2 === 1;
                  return (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className={`brand-card group block rounded-lg bg-card-bg px-6 py-7 text-center${
                        centerLast
                          ? " md:col-span-2 md:mx-auto md:w-full md:max-w-[calc((100%-4rem)/2)]"
                          : ""
                      }`}
                    >
                      <div className="mb-[18px] flex min-h-[72px] items-center justify-center">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="brand-card-logo max-h-[72px] max-w-[300px] w-auto object-contain"
                          loading="lazy"
                        />
                      </div>
                      <p className="mx-auto m-0 max-w-[420px] text-sm leading-5 text-[#151617]">
                        {copy}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* О нас — фото по краям, fixed при скролле */}
        <section className="home-about-parallax py-10 md:py-14" aria-labelledby="home-about-heading">
          <div className="mx-auto max-w-2xl px-4 md:max-w-3xl">
            <div className="rounded-tl-2xl rounded-br-2xl border-[3px] border-[#E0EAF5] bg-card-bg p-6 shadow-md shadow-text-muted/8 md:p-8">
              <h2 id="home-about-heading" className="home-section-heading">
                О нас
              </h2>
              <div className="mb-6 space-y-3 text-text-main">
                <p>
                  ЭТАЛОН ПРОФИ — поставщик промышленного оборудования для котельных и систем теплоснабжения.
                  В нашем каталоге представлены котлы водогрейные и паровые, горелки газовые и дизельные,
                  деаэраторы, парогенераторы, экономайзеры и другое оборудование.
                </p>
                <p>
                  Работаем с юридическими лицами и организациями. Цены с НДС. Доставка по всей России.
                  Подбор оборудования, консультации и техническая поддержка.
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
                >
                  Подробнее
                </Link>
              </div>
            </div>
          </div>
        </section>

        <HomeLeadCta />

        {/* Popular products */}
        <section id="popular-products" className="bg-surface-tint py-6 md:py-8">
          <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-none bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-5">
            <h2 className="home-section-heading">
              Популярные товары
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  sharpCorners
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  sku={product.sku}
                  priceEur={product.priceEur}
                  priceRub={product.priceRub}
                  image={product.image}
                  burnerPowerMin={product.burnerPowerMin}
                  burnerPowerMax={product.burnerPowerMax}
                  inStock={product.inStock}
                  partnerDiscount1={product.partnerDiscount1}
                  partnerDiscount2={product.partnerDiscount2}
                  partnerDiscount3={product.partnerDiscount3}
                  leadTime={product.leadTime}
                  imagePriority={index === 0}
                />
              ))}
            </div>
          </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
