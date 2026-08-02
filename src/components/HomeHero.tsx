import { categories } from "@/data/products";
import HomeHeroView, {
  type HeroCategory,
} from "@/components/hero/HomeHeroView";

function toHeroCategories(): HeroCategory[] {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  return categories.map((cat) => {
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
}

export default function HomeHero() {
  return <HomeHeroView categories={toHeroCategories()} />;
}
