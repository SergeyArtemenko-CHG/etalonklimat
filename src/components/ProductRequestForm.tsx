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
        className="w-full max-w-md rounded-2xl bg-card-bg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-main">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted transition hover:bg-text-muted/10 hover:text-text-muted"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm leading-relaxed text-text-main">
          {lead}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            onClick={onClose}
          >
            авторизуйтесь
          </Link>{" "}
          или свяжитесь с нами по телефону{" "}
          <a
            href={`tel:${PHONE_TEL}`}
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            {PHONE_DISPLAY}
          </a>{" "}
          или по e-mail{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        {type === "price" && (
          <p className="mt-3 rounded-lg bg-text-muted/5 px-3 py-2 text-sm text-text-muted">
            Товар: {productName}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-text-muted/25 px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-text-muted/5"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
