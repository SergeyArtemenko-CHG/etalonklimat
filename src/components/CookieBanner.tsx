"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookieConsent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-[fadeSlideIn_0.5s_ease-out] px-4 py-4 shadow-lg sm:px-6 md:px-8"
      role="banner"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-xl bg-[#003366] px-4 py-4 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed sm:text-base">
          Мы используем файлы cookie, чтобы улучшить работу сайта. Продолжая
          использовать сайт, вы соглашаетесь с нашей{" "}
          <Link
            href="/privacy-policy"
            className="underline decoration-white/70 underline-offset-2 transition hover:decoration-white"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            Политикой в отношении обработки персональных данных
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleAccept}
          className="shrink-0 rounded-lg bg-[#ff8c00] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff9f26] focus:outline-none focus:ring-2 focus:ring-[#ff8c00] focus:ring-offset-2 focus:ring-offset-[#003366]"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
