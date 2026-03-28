"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import AddToCartButton from "@/components/AddToCartButton";
import { useProductRequestStore } from "@/store/productRequest";

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
  leadTime,
}: ProductPageActionsProps) {
  const [qty, setQty] = useState(1);
  const openRequestModal = useProductRequestStore((s) => s.open);
  const { data: session } = useSession();
  const isAuthorized = Number.isFinite((session?.user as any)?.status);

  const openChat = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
  };

  if (!inStock) {
    if (isAuthorized && !!leadTime?.trim()) {
      return null;
    }
    return (
      <button
        type="button"
        onClick={() =>
          openRequestModal({
            type: "price",
            productName: name,
            productId: id,
            productSku: sku,
          })
        }
        className="w-full rounded-xl bg-[#FF8C00] px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg"
      >
        {isAuthorized ? "Запросить" : "Узнать цену и срок поставки"}
      </button>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Количество:</span>
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-600 transition hover:bg-slate-200"
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
            className="h-10 w-14 border-x border-slate-200 text-center text-sm font-medium tabular-nums"
          />
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-600 transition hover:bg-slate-200"
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
        />
        <button
          type="button"
          onClick={openChat}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#0088cc] hover:bg-slate-50 hover:text-[#0088cc] sm:w-auto"
        >
          Консультация с инженером
        </button>
      </div>
    </>
  );
}

