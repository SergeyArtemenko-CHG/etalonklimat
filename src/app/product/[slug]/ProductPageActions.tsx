"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

type ProductPageActionsProps = {
  id: string;
  name: string;
  sku: string;
  image?: string;
  priceEur?: number;
  priceRub?: number;
  inStock?: boolean;
  leadTime?: string;
};

export default function ProductPageActions({
  id,
  name,
  sku,
  image,
  priceEur,
  priceRub,
  inStock = true,
}: ProductPageActionsProps) {
  const [qty, setQty] = useState(1);

  const openChat = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-text-muted">Количество:</span>
        <div className="flex overflow-hidden rounded-lg border border-text-muted/25">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-10 w-10 items-center justify-center bg-main-bg text-text-muted transition hover:bg-text-muted/20"
            aria-label="Уменьшить"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="h-10 w-14 border-x border-text-muted/25 text-center text-sm font-medium tabular-nums"
          />
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="flex h-10 w-10 items-center justify-center bg-main-bg text-text-muted transition hover:bg-text-muted/20"
            aria-label="Увеличить"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <AddToCartButton
          id={id}
          name={name}
          sku={sku}
          image={image}
          priceEur={priceEur}
          priceRub={priceRub}
          quantity={qty}
          variant="page"
          label={inStock ? "В корзину" : "Под заказ"}
        />
        <button
          type="button"
          onClick={openChat}
          className="w-full rounded-xl border border-text-muted/35 px-4 py-3 text-sm font-semibold text-text-main transition hover:border-[#0088cc] hover:bg-text-muted/5 hover:text-[#0088cc] sm:w-auto"
        >
          Консультация с инженером
        </button>
      </div>
    </>
  );
}
