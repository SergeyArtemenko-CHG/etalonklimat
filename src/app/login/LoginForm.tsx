"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl: "/",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Авторизация</h1>
      <p className="mb-6 text-sm text-slate-600">
        Введите ваши данные для входа. После авторизации будут доступны
        персональные цены и скидки.
      </p>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-[#FF8C00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff9f26] disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/" className="text-[#FF8C00] hover:underline">
          ← Вернуться на главную
        </Link>
      </p>
    </div>
  );
}

