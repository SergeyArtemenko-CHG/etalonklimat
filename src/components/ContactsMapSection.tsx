"use client";

import dynamic from "next/dynamic";

const YandexMapCard = dynamic(() => import("@/components/YandexMapCard"), {
  ssr: false,
  loading: () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-500 sm:h-[260px]">
        Загрузка карты...
      </div>
    </div>
  ),
});

export default function ContactsMapSection() {
  return <YandexMapCard />;
}
