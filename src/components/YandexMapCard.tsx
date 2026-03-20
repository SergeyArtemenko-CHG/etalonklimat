"use client";

export default function YandexMapCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="relative aspect-[16/9] w-full min-h-[220px] sm:min-h-[260px]">
        <iframe
          title="Офис на Яндекс Картах"
          src="https://yandex.ru/map-widget/v1/?ll=37.7718%2C55.7526&z=16&pt=37.7718%2C55.7526~pm2rdm"
          width="100%"
          height="100%"
          style={{ border: 0, position: "relative" }}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3">
        <a
          href="https://yandex.ru/maps/-/CPFXqI~6"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF8C00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ff9f26] focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2 focus:ring-offset-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 8c0-3.31-2.69-6-6-6S6 4.69 6 8c0 4.5 6 11 6 11s6-6.5 6-11z" />
            <circle cx="12" cy="8" r="2.5" />
          </svg>
          Открыть в Яндекс Картах
        </a>
      </div>
    </div>
  );
}

