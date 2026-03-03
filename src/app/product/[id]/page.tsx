import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";
import {
  getCategoryBySlug,
  getProductById,
} from "@/data/products";
import ProductImage from "@/components/ProductImage";
import ProductPageActions from "./ProductPageActions";
import ProductPriceDisplay from "@/components/ProductPriceDisplay";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const categoryMatch = getCategoryBySlug(product.categorySlug);

  return (
    <div className="min-h-screen bg-slate-100">
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
          <div className="mb-8 grid gap-6 md:grid-cols-[1fr,400px] lg:grid-cols-[1fr,420px]">
            {/* Photo area */}
            <div className="flex justify-center">
              <div className="flex aspect-square w-full max-w-[400px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                  fallbackToPlaceholder
                />
              </div>
            </div>

            {/* Right block: price, sku, quantity, button */}
            <div className="flex flex-col rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
              <h1 className="mb-2 text-xl font-semibold text-slate-900 md:text-2xl">
                {product.name}
              </h1>
              <span className="mb-4 text-sm text-slate-500">
                Артикул: {product.sku}
              </span>
              <div className="mb-4 flex items-center gap-2">
                {product.inStock !== false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-2.5 py-1 text-xs font-medium text-[#ff8c00]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff8c00]" />
                    В наличии
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Под заказ
                  </span>
                )}
              </div>
              {product.inStock !== false && (
                <>
                  <p className="mb-6 text-2xl font-bold text-slate-900 md:text-3xl">
                    <ProductPriceDisplay
                      priceEur={product.priceEur}
                      priceRub={product.priceRub}
                    />
                  </p>
                  <span className="mb-3 text-xs text-slate-400">Цена с НДС</span>
                </>
              )}
              <ProductPageActions
                id={product.id}
                name={product.name}
                sku={product.sku}
                priceEur={product.priceEur}
                priceRub={product.priceRub}
                inStock={product.inStock}
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
