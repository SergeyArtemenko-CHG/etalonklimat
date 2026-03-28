"use client";

import { useId, useRef, useState } from "react";
import PersonalDataConsentCheckbox, {
  consentDisabledButtonClass,
} from "@/components/PersonalDataConsentCheckbox";

export type RequestType = "discount" | "price";

type ProductRequestFormProps = {
  type: RequestType;
  productName: string;
  productId?: string;
  productSku?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ProductRequestForm({
  type,
  productName,
  productId,
  productSku,
  onClose,
  onSuccess,
}: ProductRequestFormProps) {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const consentId = useId().replace(/:/g, "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const endpoint = type === "discount" ? "/api/request-discount" : "/api/request-price";
  const title =
    type === "discount"
      ? "Получить индивидуальную скидку"
      : "Узнать цену и срок поставки";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotRef.current?.value) return; // Honeypot: bot detected
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Заполните имя и телефон");
      return;
    }
    if (!consent) {
      setError("Подтвердите согласие на обработку персональных данных");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          productName,
          productId,
          productSku: type === "price" ? productSku : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Ошибка отправки");
      }
      setSuccess(true);
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <p className="py-4 text-center text-green-600">
            Заявка отправлена. Мы свяжемся с вами в ближайшее время.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
              aria-hidden
            />
            <div>
              <label htmlFor="req-name" className="mb-1 block text-sm font-medium text-slate-700">
                Имя
              </label>
              <input
                id="req-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                placeholder="Ваше имя"
              />
            </div>
            <div>
              <label htmlFor="req-phone" className="mb-1 block text-sm font-medium text-slate-700">
                Телефон
              </label>
              <input
                id="req-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#FF8C00] focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            {type === "price" && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Товар: {productName}
              </div>
            )}
            <PersonalDataConsentCheckbox
              id={`product-request-consent-${consentId}`}
              checked={consent}
              onChange={setConsent}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !consent}
                className={`flex-1 rounded-xl bg-[#FF8C00] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] disabled:opacity-70 ${consentDisabledButtonClass}`}
              >
                {loading ? "Отправка…" : "Отправить"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
