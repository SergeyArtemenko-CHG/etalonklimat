"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopAuthBar() {
  const { data: session, status } = useSession();

  // Пока не знаем статус — не показываем панель, чтобы не мигала
  if (status === "loading") return null;

  const isAuthorized = !!session?.user;

  return (
    <div className="w-full bg-[#0b1f33] px-4 py-2.5 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
        {isAuthorized ? (
          <>
            <p className="flex items-center gap-2 text-white/95">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">
                ✓
              </span>
              <span className="font-semibold">Авторизованный клиент</span>
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF8C00] text-xs font-bold">
                  👤
                </span>
                Личный кабинет
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Выйти
              </button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
