"use client";

import Link from "next/link";

const CALLBACK_PHONE_DISPLAY = "+7 (499) 398-01-40";
const CALLBACK_PHONE_TEL = "+74993980140";

type Props = {
  success: boolean;
  orderNumber: string | null;
  error: string | null;
  totalPriceFormatted: string;
  loading: boolean;
  onSubmit: () => Promise<void>;
};

export default function CartCheckoutSection({
  success,
  orderNumber,
  error,
  totalPriceFormatted,
  loading,
  onSubmit,
}: Props) {
  return (
    <div className="mt-8 space-y-6">
      {success ? (
        <div className="flex items-center justify-center py-10">
          <div className="max-w-xl rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-green-900 md:text-2xl">
              {orderNumber
                ? `Ваш заказ ${orderNumber} сформирован.`
                : "Ваш заказ сформирован."}
            </h2>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-green-900 md:text-base">
              ВАЖНО: для подтверждения заказа свяжитесь с нами по телефону{" "}
              <a
                href={`tel:${CALLBACK_PHONE_TEL}`}
                className="text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
              >
                {CALLBACK_PHONE_DISPLAY}
              </a>
              .
            </p>
            <p className="mt-6 text-sm text-green-900 md:text-base">
              Время работы: 9:00 – 19:00 МСК.
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
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              Итого: {totalPriceFormatted}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              После оформления вы получите номер заказа и инструкцию по подтверждению по телефону.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {error && <p className="text-sm text-red-600 sm:text-right">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={() => void onSubmit()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#FF8C00] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Отправка…" : "Оформить заказ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
