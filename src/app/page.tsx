import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import HomeHero from "@/components/HomeHero";
import HomeLeadCta from "@/components/HomeLeadCta";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { featuredBrands } from "@/data/brands";
import { products } from "@/data/products";

const brandDealerCopy: Record<string, string> = {
  fbr: "Официальный дилер горелок FBR в России. Прямые поставки из Италии. Газовые, жидкотопливные и комбинированные горелки для промышленных и коммерческих котлов.",
  energostandart:
    "Прямой поставщик оборудования «Энергостандарт». Водогрейные и паровые котлы, деаэраторы и вспомогательные системы для котельных.",
  egs: "Официальный партнёр «ЭнергоГазСервис». Котельное и горелочное оборудование для теплоснабжения и технологического пара.",
  execo:
    "Прямые поставки горелок ЭксЭко. Модулируемые горелочные устройства с высокой энергоэффективностью и низкими выбросами.",
  vandjord:
    "Официальный дилер насосов Vandjord. Насосное оборудование для отопления, водоснабжения и инженерных систем объектов любой сложности.",
};

const HIGHLIGHT_TERMS = [
  "официальный дилер",
  "официальный партнёр",
  "прямой поставщик",
  "прямые поставки",
];

function withGreenHighlights(text: string): ReactNode[] {
  const pattern = new RegExp(
    `(${HIGHLIGHT_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isHit = HIGHLIGHT_TERMS.some(
      (t) => t.toLowerCase() === part.toLowerCase(),
    );
    if (isHit) {
      return (
        <span key={i} className="text-[#91c73e]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Home() {
  const popularProducts = products.filter((p) => p.popular === true).slice(0, 8);

  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main>
        <HomeHero />

        {/* Brands — источник: data/nomenclature/Brands.csv */}
        {featuredBrands.length > 0 ? (
          <section
            className="bg-[#f8f9fa] pb-8 pt-8 md:pb-10 md:pt-10"
            aria-label="Эталон Профи — официальный дилер"
          >
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex overflow-hidden rounded-tl-2xl rounded-br-2xl border-[6px] border-[#16566f] bg-card-bg shadow-md shadow-text-muted/8">
                <div className="flex shrink-0 items-center justify-center bg-[#16566f] px-3 py-6 md:px-4 md:py-8">
                  <p className="m-0 rotate-180 font-sans text-[clamp(1.2rem,2vw,1.75rem)] font-extrabold leading-tight tracking-[0.02em] text-white [writing-mode:vertical-rl]">
                    Эталон Профи:
                  </p>
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-center gap-6 p-5 md:gap-8 md:px-10 md:py-7">
                  {featuredBrands.map((brand, i) => {
                    const logoRight = i % 2 === 1;
                    const copy =
                      brandDealerCopy[brand.slug] ??
                      `Официальный дилер ${brand.name}. Оборудование для котельных и систем теплоснабжения.`;
                    return (
                      <Link
                        key={brand.slug}
                        href={`/brands/${brand.slug}`}
                        className={`group flex w-full max-w-3xl items-center overflow-hidden border border-text-muted/20 bg-main-bg transition hover:border-[#16566f]/50 hover:bg-card-bg ${
                          logoRight ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex size-[8.5rem] shrink-0 items-center justify-center bg-card-bg p-4 md:size-[10rem] md:p-5 ${
                            logoRight
                              ? "border-l border-text-muted/20"
                              : "border-r border-text-muted/20"
                          }`}
                        >
                          <img
                            src={brand.logo}
                            alt=""
                            className="max-h-full max-w-full object-contain saturate-50 transition-[filter] duration-500 ease-in-out group-hover:saturate-100"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center px-4 py-3 md:px-6 md:py-4">
                          <span className="font-sans text-[0.95rem] font-bold leading-snug tracking-[0.02em] text-text-main">
                            {withGreenHighlights(copy)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* О нас — фото по краям, fixed при скролле */}
        <section className="home-about-parallax py-10 md:py-14" aria-labelledby="home-about-heading">
          <div className="mx-auto max-w-2xl px-4 md:max-w-3xl">
            <div className="rounded-tl-2xl rounded-br-2xl border-[6px] border-[#26999c] bg-card-bg p-6 shadow-md shadow-text-muted/8 md:p-8">
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
                  className="inline-flex items-center justify-center bg-[#26999c] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
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
