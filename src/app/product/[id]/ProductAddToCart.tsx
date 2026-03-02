"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

type ProductAddToCartProps = {
  id: string;
  name: string;
  priceEur?: number;
  priceRub?: number;
};

export default function ProductAddToCart({
  id,
  name,
  priceEur,
  priceRub,
}: ProductAddToCartProps) {
  const [qty, setQty] = useState(1);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Количество:</span>
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
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
      <AddToCartButton
        id={id}
        name={name}
        priceEur={priceEur}
        priceRub={priceRub}
        quantity={qty}
        variant="page"
      />
    </>
  );
}
