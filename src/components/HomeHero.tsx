import { categories, products } from "@/data/products";
import HomeHeroView, {
  type HeroCategory,
} from "@/components/hero/HomeHeroView";

/** 0 = горелки, 1 = котлы/парогенераторы, 2 = насосы/деаэраторы, 3 = остальное */
function heroGroup(slug: string): 0 | 1 | 2 | 3 {
  if (slug.includes("gorelki")) return 0;
  if (slug.includes("kotly") || slug.includes("parogenerator")) return 1;
  if (slug.includes("nasos") || slug.includes("deaerator")) return 2;
  return 3;
}

function isRealProductImage(image?: string): boolean {
  if (!image || typeof image !== "string") return false;
  const path = image.trim().toLowerCase();
  if (!path) return false;
  // Catalog placeholder — not a real product photo
  if (path.includes("no-image")) return false;
  if (path.includes("placeholder")) return false;
  return true;
}

function firstImageByCategory(): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(products)) return map;
  for (const p of products) {
    if (!p?.categorySlug || !isRealProductImage(p.image)) continue;
    if (!map.has(p.categorySlug)) map.set(p.categorySlug, p.image!);
  }
  return map;
}

function toHeroCategories(): HeroCategory[] {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const images = firstImageByCategory();

  const mapped = categories.map((cat) => {
    const subs = cat.subCategories ?? [];
    const description =
      subs.length > 0
        ? subs
            .slice(0, 2)
            .map((s) => s.name)
            .join(" · ")
        : "Оборудование для котельных и теплоснабжения.";

    return {
      slug: cat.slug,
      name: cat.name,
      description,
      image: images.get(cat.slug),
    };
  });

  // Порядок: горелки → котлы/парогенераторы → насосы/деаэраторы → остальное.
  // Цвета полос по-прежнему от индекса после сортировки.
  return [...mapped].sort(
    (a, b) => heroGroup(a.slug) - heroGroup(b.slug)
  );
}

export default function HomeHero() {
  return <HomeHeroView categories={toHeroCategories()} />;
}
