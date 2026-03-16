"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function TopAuthBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const auth = typeof window !== "undefined" && (
        document.cookie.includes("etalon_auth=") ||
        localStorage.getItem("etalon_auth") === "1"
      );
      setHidden(!!auth);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div className="w-full bg-[#0b1f33] px-4 py-2.5 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-white/95">
          Войдите, чтобы увидеть цены с Вашей персональной скидкой. Для авторизованных покупателей доступны{" "}
          <span className="relative inline-block px-1.5">
            <span className="relative z-10 font-extrabold text-[#FF8C00]">
              скидки до 50%
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm"
            >
              <span
                className="absolute inset-y-0.5 left-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70 animate-[shimmer_5s_linear_infinite]"
              />
            </span>
          </span>{" "}
          от цен на сайте, актуальные цены и сроки поставки на товар под заказ.
        </p>
        <Link
          href="/login"
          className="shrink-0 rounded-lg bg-[#FF8C00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff9f26]"
        >
          Авторизоваться
        </Link>
      </div>
    </div>
  );
}
