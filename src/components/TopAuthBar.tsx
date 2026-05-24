"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopAuthBar() {
  const { data: session, status } = useSession();

  // Пока не знаем статус — не показываем панель, чтобы не мигала
  if (status === "loading") return null;

  if (!session?.user) return null;

  return (
    <div className="w-full border-b-2 border-accent bg-auth-bg px-4 py-3 text-white shadow-md shadow-black/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm md:gap-4">
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
      </div>
    </div>
  );
}
