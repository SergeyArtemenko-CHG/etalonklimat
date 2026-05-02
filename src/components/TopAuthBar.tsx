"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopAuthBar() {
  const { data: session, status } = useSession();

  // Пока не знаем статус — не показываем панель, чтобы не мигала
  if (status === "loading") return null;

  const isAuthorized = !!session?.user;

  return (
    <div className="w-full border-b-2 border-accent bg-auth-bg px-4 py-3 text-white shadow-md shadow-black/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm md:gap-4">
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
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold">
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
          <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
            <div className="flex min-w-0 items-start gap-3 md:flex-1 md:items-center md:gap-4">
              <span
                className="relative mt-0.5 inline-flex shrink-0 md:mt-0"
                aria-hidden
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent shadow-inner shadow-black/10 md:h-12 md:w-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6 md:h-7 md:w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </span>
                <span className="absolute -bottom-px -right-px flex h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-auth-bg bg-accent px-1 text-[10px] font-extrabold leading-none text-white shadow-sm md:h-[22px] md:min-w-[22px] md:text-[11px]">
                  %
                </span>
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-white md:text-[0.9375rem] md:leading-relaxed lg:text-base">
                Войдите, чтобы увидеть цены с Вашей персональной скидкой. Для
                авторизованных покупателей доступны{" "}
                <span className="relative inline-block px-1.5">
                  <span className="relative z-10 font-extrabold text-accent">
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
                от цен на сайте, актуальные цены и сроки поставки на товар под
                заказ.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full shrink-0 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent-hover md:w-auto md:py-2"
            >
              Авторизоваться
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
