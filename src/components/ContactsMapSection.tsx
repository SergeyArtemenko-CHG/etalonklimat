"use client";

import dynamic from "next/dynamic";

const YandexMapCard = dynamic(() => import("@/components/YandexMapCard"), {
  ssr: false,
  loading: () => (
    <div className="overflow-hidden rounded-2xl border border-text-muted/25 bg-card-bg shadow-lg">
      <div className="flex h-[220px] items-center justify-center text-sm text-text-muted sm:h-[260px]">
        Загрузка карты...
      </div>
    </div>
  ),
});

export default function ContactsMapSection() {
  return <YandexMapCard />;
}
