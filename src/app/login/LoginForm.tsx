"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginForm() {
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId.trim() || !password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signIn("credentials", {
        partnerId: partnerId.trim(),
        password,
        redirect: true,
        callbackUrl: "/account",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md shadow-slate-200/60">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Авторизация</h1>
      <p className="mb-6 text-sm text-slate-600">
        Введите ID партнёра и пароль. После входа будут доступны персональные цены и скидки.
      </p>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="login-partner-id">
          ID партнёра
        </label>
        <input
          id="login-partner-id"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="ID партнёра"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value.replace(/\D/g, ""))}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
          autoComplete="username"
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
          {isSubmitting ? "Вход…" : "Авторизоваться"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link
          href="/login/access"
          className="text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
        >
          получить данные для входа в личный кабинет
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/" className="text-[#FF8C00] hover:underline">
          ← Вернуться на главную
        </Link>
      </p>
    </div>
  );
}
