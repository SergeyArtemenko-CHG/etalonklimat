import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/lib/company";

export const metadata: Metadata = {
  title: "Данные для входа",
  description:
    "Как получить ID партнёра и пароль для входа в личный кабинет.",
};

export default function LoginAccessInfoPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl bg-card-bg p-6 shadow-md shadow-text-muted/8 md:p-8">
          <h1 className="mb-4 text-xl font-semibold text-text-main md:text-2xl">
            Данные для входа
          </h1>
          <p className="text-sm leading-relaxed text-text-main md:text-base">
            Для получения данных для входа в личный кабинет свяжитесь с нами по телефону:{" "}
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>{" "}
            или по E-mail:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-8 text-center text-sm text-text-muted">
            <Link
              href="/login"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              ← К форме входа
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-text-muted">
            <Link href="/" className="text-accent hover:underline">
              На главную
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
