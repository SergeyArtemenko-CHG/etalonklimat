import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { products, categories } from "@/data/products";
import Link from "next/link";

function CategoryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="5" width="17" height="6" rx="1.5" />
      <rect x="3.5" y="13" width="10" height="6" rx="1.5" />
      <circle cx="18.5" cy="16" r="2.5" />
    </svg>
  );
}

export default function Home() {
  const popularProducts = products.filter((p) => p.priceEur != null || p.priceRub != null).slice(0, 8);
  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b?.trim())))
  ).sort((a, b) => a.localeCompare(b, "ru")).slice(0, 6);

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
              href="/category/gorelki-dlya-kotlov-otopleniya"
              className="inline-block rounded-xl bg-[#FF8C00] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg"
            >
              В каталог
            </Link>
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
                  <CategoryIcon className="h-6 w-6 text-[#003366]" />
                </div>
                <span className="font-medium text-slate-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular products + Brands */}
        <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
              Популярные товары
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product) => (
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
                />
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mt-8 rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-5">
            <h2 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
              Наши бренды
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {uniqueBrands.map((brand) => (
                <div
                  key={brand}
                  className="flex h-14 min-w-[100px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO text */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60 md:p-8">
            <h2 className="mb-4 text-xl font-semibold text-[#0b1f33]">
              О компании ЭТАЛОН
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                ЭТАЛОН — поставщик промышленного оборудования для котельных и систем теплоснабжения.
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
