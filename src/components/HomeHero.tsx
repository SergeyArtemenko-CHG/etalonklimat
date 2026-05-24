import Link from "next/link";

/** Полосы hero: разные кадры + увеличение и object-position — видна только часть фото. */
const HERO_STRIPS = [
  {
    src: "/images/products/ONIX10-85.webp",
    objectClass: "object-[18%_52%]",
    scaleClass: "scale-[1.38]",
  },
  {
    src: "/images/products/FBR_GAS_P_70_100_150_2.webp",
    objectClass: "object-[72%_48%]",
    scaleClass: "scale-[1.32]",
  },
  {
    src: "/images/products/DA-ES.webp",
    objectClass: "object-[48%_38%]",
    scaleClass: "scale-[1.28]",
  },
  {
    src: "/images/products/FBR_FGP_190_250_M.webp",
    objectClass: "object-[35%_62%]",
    scaleClass: "scale-[1.34]",
  },
  {
    src: "/images/products/FBR_GAS_1_2.webp",
    objectClass: "object-[28%_72%]",
    scaleClass: "scale-[1.3]",
  },
  {
    src: "/images/products/BDV-ES.webp",
    objectClass: "object-[58%_45%]",
    scaleClass: "scale-[1.26]",
  },
] as const;

export default function HomeHero() {
  return (
    <section className="relative isolate overflow-visible bg-surface-tint">
      <div className="hero-shell">
        <div className="hero-photo-slot z-0 bg-transparent" aria-hidden>
          <div className="hero-photo-masked-surface">
            <div className="hero-photo-strips-grid h-full w-full min-h-0">
              {HERO_STRIPS.map((strip, index) => (
                <div
                  key={`${strip.src}-${index}`}
                  className="hero-photo-strip border-r border-white/15 last:border-r-0"
                >
                  <img
                    src={strip.src}
                    alt=""
                    width={800}
                    height={600}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className={`origin-top grayscale contrast-[1.05] ${strip.objectClass} ${strip.scaleClass}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="hero-photo-slot hero-photo-masked-surface hero-photo-gradient-fill z-[1] bg-transparent"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-6xl items-center justify-start px-4 py-12 md:px-12 md:py-16 [&_a]:pointer-events-auto">
          <div className="hero-text-block w-full max-w-3xl pl-5 text-left md:pl-6">
            <h1 className="mb-4 text-3xl font-normal tracking-normal text-white md:text-5xl">
              Оборудование для котельных и теплоснабжения
            </h1>
            <p className="mb-3 text-lg font-normal text-white md:text-2xl">
              Котлы, горелки, деаэраторы, парогенераторы и комплектующие
            </p>
            <Link
              href="/about"
              className="mt-10 inline-block rounded-none bg-white px-8 py-3 text-base font-medium text-slate-800 shadow-md transition hover:bg-slate-100"
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
