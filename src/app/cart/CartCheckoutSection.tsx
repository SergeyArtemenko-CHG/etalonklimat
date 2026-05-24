"use client";

import Link from "next/link";
import RetailPriceLabel from "@/components/RetailPriceLabel";

const CALLBACK_PHONE_DISPLAY = "+7 (499) 398-01-40";
const CALLBACK_PHONE_TEL = "+74993980140";

type Props = {
  success: boolean;
  orderNumber: string | null;
  error: string | null;
  totalPriceFormatted: string;
  showRetailPriceLabel?: boolean;
  loading: boolean;
  onSubmit: () => Promise<void>;
};

export default function CartCheckoutSection({
  success,
  orderNumber,
  error,
  totalPriceFormatted,
  showRetailPriceLabel = false,
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
                className="text-primary underline underline-offset-2 hover:text-accent"
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
              className="mt-8 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover hover:shadow-lg"
            >
              Вернуться в каталог
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-text-muted/25 bg-card-bg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg font-bold text-text-main">
              <span>
                Итого: {totalPriceFormatted}
              </span>
              <RetailPriceLabel show={showRetailPriceLabel} />
            </p>
            <p className="mt-1 text-xs text-text-muted">
              После оформления вы получите номер заказа и инструкцию по подтверждению по телефону.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {error && <p className="text-sm text-red-600 sm:text-right">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={() => void onSubmit()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Отправка…" : "Оформить заказ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
