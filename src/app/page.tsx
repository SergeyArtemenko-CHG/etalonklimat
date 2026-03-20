import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { products, categories } from "@/data/products";
import Link from "next/link";

function CategoryIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const key = slug.toLowerCase();

  // Горелки
  if (key.includes("gorelki")) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          d="M12 3c1.8 1.6 3.5 3.8 3.5 6.2 0 2.2-1.6 3.8-3.5 3.8S8.5 11.4 8.5 9.2C8.5 6.8 10.2 4.6 12 3Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M8.5 13.5C7.3 14.3 6.5 15.7 6.5 17.2 6.5 19.4 8.4 21 12 21s5.5-1.6 5.5-3.8c0-1.5-.8-2.9-2-3.7"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Котлы (водогрейные / паровые / конденсационные)
  if (key.includes("kotly") || key.includes("kotel") || key.includes("kotelnye")) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <rect x="7" y="8" width="10" height="5" rx="1.5" />
        <path d="M8 17h8" />
        <circle cx="9" cy="11" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  // Деаэраторы, баки, сосуды
  if (key.includes("deaerator") || key.includes("deaeratory") || key.includes("bak")) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="8" width="16" height="8" rx="3" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        <path d="M6 16v2M18 16v2" strokeLinecap="round" />
      </svg>
    );
  }

  // Пар / давление / парогенераторы
  if (key.includes("parov") || key.includes("parogenerator") || key.includes("par")) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M8 17c0-1 .4-1.5.9-2 .5-.5 1.1-1 .1-2C8 11 8.6 10.5 9.1 10 9.6 9.5 10 9 10 8"
          strokeLinecap="round"
        />
        <path
          d="M14 17c0-1 .4-1.5.9-2 .5-.5 1.1-1 .1-2C14 11 14.6 10.5 15.1 10 15.6 9.5 16 9 16 8"
          strokeLinecap="round"
        />
        <rect x="4" y="17" width="16" height="3" rx="1.5" />
      </svg>
    );
  }

  // Аксессуары / универсальная иконка
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M15 13h3v7h-3z" />
    </svg>
  );
}

export default function Home() {
  const isSmallBurner = (p: (typeof products)[number]) => {
    const hasPrice = p.priceEur != null || p.priceRub != null;
    const isBurnerCategory = p.categorySlug === "gorelki-dlya-kotlov-otopleniya";
    const maxPower = p.burnerPowerMax ?? p.burnerPowerMin ?? Number.POSITIVE_INFINITY;
    return hasPrice && isBurnerCategory && maxPower <= 1000;
  };

  const pseudoRandomOrder = (value: string) => {
    let h = 0;
    for (let i = 0; i < value.length; i++) {
      h = (h * 31 + value.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  const shuffled = <T extends { id: string }>(arr: T[]) =>
    [...arr].sort((a, b) => pseudoRandomOrder(a.id) - pseudoRandomOrder(b.id));

  const gasAndCombinedWithPlus = products.filter(
    (p) =>
      isSmallBurner(p) &&
      p.name.includes("+") &&
      /(газов|комбинирован)/i.test(p.name)
  );

  const dieselBurners = products.filter(
    (p) => isSmallBurner(p) && /дизельн/i.test(p.name)
  );

  const selected = [
    ...shuffled(gasAndCombinedWithPlus).slice(0, 5),
    ...shuffled(dieselBurners).slice(0, 3),
  ];

  const uniqueSelected = selected.filter(
    (item, idx, arr) => arr.findIndex((p) => p.id === item.id) === idx
  );

  const popularProducts =
    uniqueSelected.length >= 8
      ? uniqueSelected.slice(0, 8)
      : [
          ...uniqueSelected,
          ...shuffled(
            products.filter(
              (p) => isSmallBurner(p) && !uniqueSelected.some((s) => s.id === p.id)
            )
          ).slice(0, 8 - uniqueSelected.length),
        ];
  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b?.trim())))
  ).sort((a, b) => a.localeCompare(b, "ru")).slice(0, 6);

  const featuredBrands = [
    {
      name: "Энергостандарт",
      slug: "energostandart",
      logo: "/images/brands/ENERGOSTANDART.png",
    },
    {
      name: "FBR",
      slug: "fbr",
      logo: "/images/brands/FBR.png",
    },
    {
      name: "ЭнергоГаз Сервис",
      slug: "egs",
      logo: "/images/brands/ICI.png",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-[#003366] to-[#004080] px-4 py-12 md:py-16">
          <div className="mx-auto max-w-6xl text-center text-white">
            <h1 className="mb-4 text-2xl font-bold md:text-4xl">
              Оборудование для котельных и теплоснабжения
            </h1>
            <p className="mb-6 text-lg text-white/90 md:text-xl">
              Котлы, горелки, деаэраторы, парогенераторы и комплектующие
            </p>
            <Link
              href="/#categories"
              className="inline-block rounded-xl bg-[#FF8C00] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg"
            >
              В каталог
            </Link>
          </div>
        </section>

        {/* Brands */}
        <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
              Наши бренды
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="group flex h-20 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 shadow-sm transition hover:border-[#FF8C00]/60 hover:bg-white hover:shadow-md"
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-14 max-w-[140px] object-contain grayscale group-hover:grayscale-0 transition"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Categories grid */}
        <section id="categories" className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 text-xl font-semibold text-[#0b1f33] md:text-2xl">
            Категории
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 12).map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#FF8C00]/50 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#003366]/10">
                  <CategoryIcon slug={cat.slug} className="h-6 w-6 text-[#003366]" />
                </div>
                <span className="font-medium text-slate-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular products */}
        <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
              Популярные товары
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
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
        </section>

        {/* SEO text */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60 md:p-8">
            <h2 className="mb-4 text-xl font-semibold text-[#0b1f33]">
              О компании ЭТАЛОН ПРОФИ
            </h2>
            <div className="space-y-3 text-slate-700">
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
