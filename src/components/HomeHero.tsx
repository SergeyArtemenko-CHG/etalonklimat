import Image from "next/image";
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
    <section className="relative isolate min-h-[300px] overflow-hidden md:min-h-[380px]">
      <div className="absolute inset-0 z-0 flex" aria-hidden>
        {HERO_STRIPS.map((strip, index) => (
          <div
            key={`${strip.src}-${index}`}
            className="relative min-h-full min-w-0 flex-1 overflow-hidden border-r border-white/15 last:border-r-0"
          >
            <Image
              src={strip.src}
              alt=""
              fill
              className={`object-cover grayscale contrast-[1.05] ${strip.objectClass} ${strip.scaleClass}`}
              sizes="(max-width: 768px) 20vw, 17vw"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Затемнение + лёгкий оттенок из палитры темы — без этого текст на фото плохо читается */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/88 via-slate-950/62 to-slate-950/88"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[var(--hero-from)]/35 via-transparent to-[var(--hero-to)]/35"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-center px-4 py-12 md:min-h-[380px] md:py-16">
        <div className="w-full max-w-3xl border border-white/15 bg-slate-950/35 px-6 py-8 text-center shadow-2xl shadow-black/40 backdrop-blur-md [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,24px_100%,0_calc(100%-24px))] md:px-10 md:py-10">
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
            Оборудование для котельных и теплоснабжения
          </h1>
          <p className="mb-6 text-lg text-white/90 drop-shadow-sm md:text-xl">
            Котлы, горелки, деаэраторы, парогенераторы и комплектующие
          </p>
          <Link
            href="/#categories"
            className="inline-block rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-accent-hover hover:shadow-xl"
          >
            В каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
