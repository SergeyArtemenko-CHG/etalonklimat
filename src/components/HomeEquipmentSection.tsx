"use client";

import Link from "next/link";

function openChatWidget() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
  }
}

function IconSelection({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 7h8M8 11h5" strokeLinecap="round" />
      <path d="M14.5 14.5 17 17" strokeLinecap="round" />
      <circle cx="11" cy="15" r="2.25" />
    </svg>
  );
}

function IconTurnkey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
      <path d="M9 12h6M9 15h4" strokeLinecap="round" />
    </svg>
  );
}

function IconCommissioning({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5 5a1.5 1.5 0 0 0 2.1 2.1l5-5a4 4 0 0 0 5.4-5.4l-1.5 1.5-2.1-2.1 1.5-1.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4l4 4" strokeLinecap="round" />
    </svg>
  );
}

function IconAudit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 18V6l8-3 8 3v12l-8 3-8-3Z" strokeLinejoin="round" />
      <path d="M12 9v9M4 6l8 3 8-3" strokeLinejoin="round" />
      <path d="M9 10.5v6M15 10.5v6" strokeLinecap="round" />
    </svg>
  );
}

const EQUIPMENT_SERVICES = [
  {
    title: "Подбор и расчёт оборудования",
    description:
      "Бесплатный инженерный подбор насосов и горелок по вашим опросным листам или ТЗ за 1 день.",
    Icon: IconSelection,
    cta: "survey" as const,
  },
  {
    title: "Комплектация котельных «под ключ»",
    description:
      "Полное снабжение объектов: от крепежа и запорной арматуры до котлов и деаэраторов из одних рук.",
    Icon: IconTurnkey,
    cta: "spec" as const,
  },
  {
    title: "Шеф-монтаж и пусконаладка",
    description:
      "Квалифицированный ввод оборудования в эксплуатацию, настройка автоматики и оптимизация расхода топлива.",
    Icon: IconCommissioning,
    cta: "commissioning" as const,
  },
  {
    title: "Энергоаудит и модернизация",
    description:
      "Аудит работы старых систем, расчёт окупаемости и замена оборудования на энергоэффективные решения.",
    Icon: IconAudit,
    cta: "consultation" as const,
  },
] as const;

function ServiceCta({ type }: { type: (typeof EQUIPMENT_SERVICES)[number]["cta"] }) {
  const linkClass =
    "font-medium text-[#005f67] underline decoration-[#005f67]/35 underline-offset-2 transition hover:decoration-[#005f67]";

  if (type === "survey") {
    return (
      <p className="text-sm leading-relaxed text-text-main">
        <Link href="/contacts" className={linkClass}>
          Скачать опросный лист
        </Link>
        <span className="text-text-muted"> / </span>
        <button type="button" onClick={openChatWidget} className={`${linkClass} text-left`}>
          Оставить заявку
        </button>
      </p>
    );
  }

  if (type === "spec") {
    return (
      <button type="button" onClick={openChatWidget} className={`text-sm ${linkClass}`}>
        Отправить спецификацию на просчёт
      </button>
    );
  }

  if (type === "commissioning") {
    return (
      <button type="button" onClick={openChatWidget} className={`text-sm ${linkClass}`}>
        Запросить шеф-монтаж
      </button>
    );
  }

  return (
    <button type="button" onClick={openChatWidget} className={`text-sm ${linkClass}`}>
      Получить консультацию инженера
    </button>
  );
}

export default function HomeEquipmentSection() {
  return (
    <section id="equipment" className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="home-section-heading">Наши услуги</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {EQUIPMENT_SERVICES.map(({ title, description, Icon, cta }) => (
          <article
            key={title}
            className="flex flex-col rounded-none border border-text-muted/25 bg-card-bg p-5 shadow-sm md:p-6"
          >
            <div className="mb-4 flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-[#005f67] text-white md:h-14 md:w-14"
                aria-hidden
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <h3 className="text-base font-semibold leading-snug text-text-main md:text-lg">{title}</h3>
            </div>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-text-main/90 md:text-[0.9375rem]">
              {description}
            </p>
            <ServiceCta type={cta} />
          </article>
        ))}
      </div>
    </section>
  );
}
