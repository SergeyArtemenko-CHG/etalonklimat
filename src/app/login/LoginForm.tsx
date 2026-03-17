"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [showRegister, setShowRegister] = useState(false);
   const [orgName, setOrgName] = useState("");
   const [contactName, setContactName] = useState("");
   const [phone, setPhone] = useState("");
   const [regEmail, setRegEmail] = useState("");
   const [regLoading, setRegLoading] = useState(false);
   const [regSuccess, setRegSuccess] = useState<string | null>(null);
   const [regError, setRegError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signIn("credentials", {
        email: email.trim(),
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
      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setShowRegister((prev) => !prev);
            setRegSuccess(null);
            setRegError(null);
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Зарегистрироваться
        </button>
        {showRegister && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="mb-3 text-slate-700">
              Заполните форму, и мы создадим для вас аккаунт с персональными ценами.
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  !orgName.trim() ||
                  !contactName.trim() ||
                  !phone.trim() ||
                  !regEmail.trim() ||
                  regLoading
                ) {
                  return;
                }
                setRegError(null);
                setRegSuccess(null);
                setRegLoading(true);
                try {
                  const res = await fetch("/api/register-request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orgName: orgName.trim(),
                      contactName: contactName.trim(),
                      phone: phone.trim(),
                      email: regEmail.trim(),
                    }),
                  });
                  const data = await res.json().catch(() => null);
                  if (!res.ok) {
                    throw new Error(
                      (data && typeof data === "object" && "error" in data && (data as any).error) ||
                        "Не удалось отправить заявку"
                    );
                  }
                  setRegSuccess(
                    "Заявка на регистрацию успешно сформирована. Наш менеджер свяжется с Вами в ближайшее время."
                  );
                  setOrgName("");
                  setContactName("");
                  setPhone("");
                  setRegEmail("");
                } catch (err) {
                  setRegError(
                    err instanceof Error ? err.message : "Ошибка отправки заявки"
                  );
                } finally {
                  setRegLoading(false);
                }
              }}
            >
              <input
                type="text"
                placeholder="Наименование организации"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
                required
              />
              <input
                type="text"
                placeholder="Имя"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
                required
              />
              <input
                type="tel"
                placeholder="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF8C00]"
                required
              />
              {regError && (
                <p className="text-xs text-red-600">{regError}</p>
              )}
              {regSuccess && (
                <p className="text-xs text-emerald-600">{regSuccess}</p>
              )}
              <button
                type="submit"
                disabled={regLoading}
                className="mt-1 rounded-lg bg-[#003366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004080] disabled:opacity-70"
              >
                {regLoading ? "Отправка..." : "Отправить заявку"}
              </button>
              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                Нажимая на кнопку, я подтверждаю, что ознакомлен с информацией о
                товаре и принимаю условия{" "}
                <Link
                  href="/agreement"
                  className="underline hover:text-slate-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  пользовательского соглашения
                </Link>
                , и даю согласие на{" "}
                <Link
                  href="/privacy-policy"
                  className="underline hover:text-slate-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  обработку моих персональных данных
                </Link>
                .
              </p>
            </form>
          </div>
        )}
        <p className="text-center text-xs text-slate-500">
          <Link href="/" className="text-[#FF8C00] hover:underline">
            ← Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  );
}

