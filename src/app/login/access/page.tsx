import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Данные для входа — ETALON",
  description:
    "Как получить ID партнёра и пароль для входа в личный кабинет ETALON.",
};

export default function LoginAccessInfoPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60 md:p-8">
          <h1 className="mb-4 text-xl font-semibold text-slate-900 md:text-2xl">
            Данные для входа
          </h1>
          <p className="text-sm leading-relaxed text-slate-700 md:text-base">
            Для получения данных для входа в личный кабинет свяжитесь с нами по телефону:{" "}
            <a
              href="tel:+74993980140"
              className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            >
              +7 (499) 398-01-40
            </a>{" "}
            или по E-mail:{" "}
            <a
              href="mailto:info@etalonklimat.ru"
              className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            >
              info@etalonklimat.ru
            </a>
          </p>
          <p className="mt-8 text-center text-sm text-slate-500">
            <Link
              href="/login"
              className="text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            >
              ← К форме входа
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            <Link href="/" className="text-[#FF8C00] hover:underline">
              На главную
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
