import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryView from "@/components/CategoryView";
import {
  categories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/data/products";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryMatch = getCategoryBySlug(slug);

  if (!categoryMatch) {
    notFound();
  }

  const isTopLevelCategory = categoryMatch.kind === "category";
  const baseCategorySlug = isTopLevelCategory
    ? categoryMatch.slug
    : categoryMatch.parentSlug;

  const baseCategory = categories.find((c) => c.slug === baseCategorySlug);
  const subCategories = baseCategory?.subCategories ?? [];
  const hasSubCategories = isTopLevelCategory && subCategories.length > 0;

  const products = hasSubCategories ? [] : getProductsByCategory(slug);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="px-4 py-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          {hasSubCategories ? (
            <section className="rounded-2xl bg-white p-4 shadow-md shadow-slate-200/60 md:p-5">
              <nav className="mb-4 text-sm text-slate-500">
                <Link href="/" className="hover:text-[#003366]">
                  Главная
                </Link>
                <span className="mx-2">/</span>
                <span className="text-[#0b1f33]">{categoryMatch.name}</span>
              </nav>
              <h1 className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl">
                {categoryMatch.name}
              </h1>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subCategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/category/${sub.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 shadow-sm transition hover:border-[#FF8C00]/50 hover:bg-white hover:shadow-md"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#003366]/10 text-[#003366]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <rect x="3.5" y="5" width="17" height="6" rx="1.5" />
                        <rect x="3.5" y="13" width="10" height="6" rx="1.5" />
                        <circle cx="18.5" cy="16" r="2.5" />
                      </svg>
                    </span>
                    <span className="flex-1">{sub.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <CategoryView products={products} categoryMatch={categoryMatch} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
