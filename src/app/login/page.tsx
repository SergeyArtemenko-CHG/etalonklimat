import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход — ETALON",
  description:
    "Вход в личный кабинет по ID партнёра и паролю; персональные цены и скидки.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}
