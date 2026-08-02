import { categories } from "@/data/products";
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

function toHeroCategories(): HeroCategory[] {
  if (!Array.isArray(categories) || categories.length === 0) return [];

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
