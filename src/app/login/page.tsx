import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Вход — ETALON",
  description: "Вход в личный кабинет для просмотра персональных цен и скидок",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">
            Авторизация
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            Страница входа и регистрации. Здесь можно подключить форму логина для профессионалов и отображение персональных цен.
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
              disabled
            />
            <input
              type="password"
              placeholder="Пароль"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
              disabled
            />
            <button
              type="button"
              className="rounded-lg bg-[#FF8C00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff9f26] disabled:opacity-70"
              disabled
            >
              Войти
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            <Link href="/" className="text-[#FF8C00] hover:underline">
              ← Вернуться на главную
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
