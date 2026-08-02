import Link from "next/link";
import Header from "@/components/Header";
import HomeHero from "@/components/HomeHero";
import HomeEquipmentSection from "@/components/HomeEquipmentSection";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { featuredBrands } from "@/data/brands";
import { products } from "@/data/products";

export default function Home() {
  const popularProducts = products.filter((p) => p.popular === true).slice(0, 8);

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main>
        <HomeHero />

        {/* Brands — источник: data/nomenclature/Brands.csv */}
        {featuredBrands.length > 0 ? (
          <section className="bg-[#f8f9fa] pb-8 pt-0 md:pb-10">
            <div className="mx-auto max-w-6xl px-4">
            <div className="bg-card-bg p-4 shadow-md shadow-text-muted/8 md:p-5">
              <h2 className="home-section-heading">
                Эталон Профи — официальный дилер
              </h2>
              <div className="flex flex-wrap items-stretch justify-center gap-6 md:gap-10">
                {featuredBrands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/brands/${brand.slug}`}
                    className="group flex min-w-[140px] flex-col items-center border border-text-muted/25 bg-main-bg px-5 py-3 shadow-sm transition hover:border-accent/60 hover:bg-card-bg hover:shadow-md"
                  >
                    <div className="flex h-20 w-full items-center justify-center">
                      <img
                        src={brand.logo}
                        alt=""
                        className="max-h-14 max-w-[140px] object-contain saturate-50 transition-[filter] duration-500 ease-in-out group-hover:saturate-100"
                        loading="lazy"
                      />
                    </div>
                    <span className="mt-2 text-center text-sm font-medium text-text-main">
                      {brand.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            </div>
          </section>
        ) : null}

        <HomeEquipmentSection />

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

        {/* SEO text */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-none bg-card-bg p-6 shadow-md shadow-text-muted/8 md:p-8">
            <h2 className="home-section-heading">
              О компании ЭТАЛОН ПРОФИ
            </h2>
            <div className="space-y-3 text-text-main">
              <p>
                ЭТАЛОН ПРОФИ — поставщик промышленного оборудования для котельных и систем теплоснабжения.
                В нашем каталоге представлены котлы водогрейные и паровые, горелки газовые и дизельные,
                деаэраторы, парогенераторы, экономайзеры и другое оборудование.
              </p>
              <p>
                Работаем с юридическими лицами и организациями. Цены с НДС. Доставка по всей России.
                Подбор оборудования, консультации и техническая поддержка.
              </p>
              <p>
                Свяжитесь с нами по телефону или оставьте заявку на сайте — мы подберём оптимальное
                решение под ваши задачи.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
