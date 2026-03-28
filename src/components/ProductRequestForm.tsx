"use client";

import Link from "next/link";

export type RequestType = "discount" | "price";

const PHONE_DISPLAY = "+7 (499) 398-01-40";
const PHONE_TEL = "+74993980140";
const CONTACT_EMAIL = "info@etalonklimat.ru";

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
  onClose,
}: ProductRequestFormProps) {
  const title =
    type === "discount"
      ? "Получить индивидуальную скидку"
      : "Узнать цену и срок поставки";

  const lead =
    type === "discount"
      ? "Для получения цены, скидки и сроков поставки товара"
      : "Для получения цены и сроков поступления товара";

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

        <p className="text-sm leading-relaxed text-slate-700">
          {lead}{" "}
          <Link
            href="/login"
            className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
            onClick={onClose}
          >
            авторизуйтесь
          </Link>{" "}
          или свяжитесь с нами по телефону{" "}
          <a
            href={`tel:${PHONE_TEL}`}
            className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
          >
            {PHONE_DISPLAY}
          </a>{" "}
          или по e-mail{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-[#003366] underline underline-offset-2 hover:text-[#FF8C00]"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        {type === "price" && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Товар: {productName}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
