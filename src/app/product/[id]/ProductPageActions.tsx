"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useProductRequestStore } from "@/store/productRequest";

type ProductPageActionsProps = {
  id: string;
  name: string;
  sku: string;
  priceEur?: number;
  priceRub?: number;
  inStock?: boolean;
};

export default function ProductPageActions({
  id,
  name,
  sku,
  priceEur,
  priceRub,
  inStock = true,
}: ProductPageActionsProps) {
  const [qty, setQty] = useState(1);
  const openRequestModal = useProductRequestStore((s) => s.open);

  if (!inStock) {
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
        Узнать цену и срок поставки
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
          priceEur={priceEur}
          priceRub={priceRub}
          quantity={qty}
          variant="page"
        />
        <button
          type="button"
          onClick={() =>
            openRequestModal({
              type: "discount",
              productName: name,
              productId: id,
              productSku: sku,
            })
          }
          className="rounded-xl border-2 border-[#FF8C00] px-4 py-3 text-sm font-semibold text-[#FF8C00] transition hover:bg-[#FF8C00] hover:text-white"
        >
          Получить индивидуальную скидку
        </button>
      </div>
    </>
  );
}

