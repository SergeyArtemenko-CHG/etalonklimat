"use client";

function openChatWidget() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
  }
}

export default function HomeLeadCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10">
      <div className="rounded-tl-2xl rounded-br-2xl border-[3px] border-[#E0EAF5] bg-card-bg p-6 text-center shadow-md shadow-text-muted/8 md:p-8">
        <h2 className="home-section-heading mb-3">
          Опишите Вашу задачу — мы предложим решение!
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-text-main">
          Найдём лучший вариант оборудования под ваш запрос. Бесплатно
        </p>
        <button
          type="button"
          onClick={openChatWidget}
          className="inline-flex items-center justify-center bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
        >
          Оставить заявку
        </button>
      </div>
    </section>
  );
}
