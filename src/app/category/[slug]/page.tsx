import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryView from "@/components/CategoryView";
import {
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

  const products = getProductsByCategory(slug);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="flex justify-center px-4 py-6 md:py-8">
        <CategoryView products={products} categoryMatch={categoryMatch} />
      </main>
      <Footer />
    </div>
  );
}
