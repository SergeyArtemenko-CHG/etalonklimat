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
    <div className="rounded-2xl bg-card-bg p-6 shadow-md shadow-text-muted/8">
      <h1 className="mb-4 text-xl font-semibold text-text-main">Авторизация</h1>
      <p className="mb-6 text-sm text-text-muted">
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
          className="rounded-lg border border-text-muted/25 px-4 py-2.5 text-sm outline-none focus:border-accent"
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-text-muted/25 px-4 py-2.5 text-sm outline-none focus:border-accent"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Вход…" : "Авторизоваться"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link
          href="/login/access"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          получить данные для входа в личный кабинет
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-text-muted">
        <Link href="/" className="text-accent hover:underline">
          ← Вернуться на главную
        </Link>
      </p>
    </div>
  );
}
