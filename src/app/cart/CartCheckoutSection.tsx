"use client";

import Link from "next/link";

type Props = {
  success: boolean;
  orderNumber: string | null;
  error: string | null;
  totalPriceFormatted: string;
  customerName: string;
  customerPhone: string;
  loading: boolean;
  setCustomerName: (value: string) => void;
  setCustomerPhone: (value: string) => void;
  onSubmit: (website: string) => Promise<void>;
};

export default function CartCheckoutSection({
  success,
  orderNumber,
  error,
  totalPriceFormatted,
  customerName,
  customerPhone,
  loading,
  setCustomerName,
  setCustomerPhone,
  onSubmit,
}: Props) {
  return (
    <div className="mt-8 space-y-6">
      {success ? (
        <div className="flex items-center justify-center py-10">
          <div className="max-w-xl text-center rounded-2xl border border-green-200 bg-green-50 px-6 py-10 shadow-sm">
            <h2 className="text-2xl font-bold text-green-800 md:text-3xl">
              {orderNumber
                ? `Ваш заказ №${orderNumber} успешно оформлен!`
                : "Ваш заказ успешно оформлен!"}
            </h2>
            <p className="mt-4 text-sm text-green-800 md:text-base">
              Наш менеджер свяжется с вами в ближайшее время.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-xl bg-[#FF8C00] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg"
            >
              Вернуться в каталог
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
              aria-hidden
              id="website-honeypot"
            />
            <p className="mb-3 text-sm font-medium text-slate-700">Контактные данные для заказа</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-slate-500">Имя</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  required
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-slate-500">Телефон</span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  required
                />
              </label>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold text-slate-900">
              Итого: {totalPriceFormatted}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Скачать коммерческое предложение (PDF)
              </button>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={loading || !customerName.trim() || !customerPhone.trim()}
                  onClick={async () => {
                    const website =
                      (document.getElementById("website-honeypot") as HTMLInputElement | null)
                        ?.value ?? "";
                    await onSubmit(website);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF8C00] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Отправка…" : "Оформить заказ"}
                </button>
                <p className="text-center text-[10px] text-slate-500">
                  Нажимая кнопку, я подтверждаю, что ознакомлен с информацией о товаре и принимаю условия{" "}
                  <Link href="/agreement" className="underline hover:text-slate-700" target="_blank" rel="noopener noreferrer">
                    пользовательского соглашения
                  </Link>
                  , и даю согласие на{" "}
                  <Link href="/privacy-policy" className="underline hover:text-slate-700" target="_blank" rel="noopener noreferrer">
                    обработку моих персональных данных
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

