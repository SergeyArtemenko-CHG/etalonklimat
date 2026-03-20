import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductTabs from "@/components/ProductTabs";
import {
  getCategoryBySlug,
  getProductById,
  products,
} from "@/data/products";
import ProductImage from "@/components/ProductImage";
import ProductPageActions from "./ProductPageActions";
import ProductPriceBlock from "./ProductPriceBlock";

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Не прегенерируем сотни карточек на этапе build —
  // страницы будут создаваться по мере обращений пользователей.
  return [];
}

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
