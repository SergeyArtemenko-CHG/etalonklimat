import Link from "next/link";
import Image from "next/image";

export default function HomeHero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Профессиональный подбор и поставка котельного оборудования"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/hero-boiler-abstract.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(13,33,55,0.88) 0%, rgba(26,74,110,0.72) 45%, rgba(46,119,174,0.55) 72%, rgba(91,163,212,0.4) 100%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[300px] w-full max-w-6xl flex-col justify-center gap-10 px-4 py-14 md:min-h-[380px] md:flex-row md:items-center md:justify-between md:gap-12 md:px-6 md:py-16">
        <h1 className="font-open-sans max-w-xl text-[clamp(1.85rem,4vw,3rem)] font-bold leading-[1.15] tracking-[-0.01em] text-white md:max-w-2xl">
          Профессиональный подбор и поставка котельного оборудования
        </h1>

        <div
          className="font-open-sans relative mt-2 w-full max-w-[22rem] shrink-0 bg-[#c62828] px-6 py-6 text-white shadow-[0_16px_40px_rgba(13,33,55,0.35)] md:mt-0"
          style={{
            clipPath:
              "polygon(0 10%, 92% 0, 100% 18%, 100% 90%, 8% 100%, 0 82%)",
          }}
        >
          <p className="m-0 text-[clamp(1rem,1.7vw,1.2rem)] font-semibold leading-snug tracking-[-0.01em]">
            Скидки до 45% для зарегистрированных пользователей
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.06em] text-[#0d2137] transition hover:bg-[#E0EAF5]"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
            }}
          >
            Цены со скидкой
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
