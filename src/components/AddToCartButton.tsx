"use client";

import { useCartStore } from "@/store/cart";

type AddToCartButtonProps = {
  id: string;
  name: string;
  priceEur?: number;
  priceRub?: number;
  quantity?: number;
  variant?: "card" | "page";
};

export default function AddToCartButton({
  id,
  name,
  priceEur,
  priceRub,
  quantity = 1,
  variant = "card",
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = () => {
    addItem({ id, name, priceEur, priceRub, quantity });
  };

  const baseCard =
    "flex items-center justify-center rounded-lg bg-[#FF8C00] text-white font-semibold shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg";
  const basePage =
    "rounded-xl bg-[#FF8C00] text-white font-semibold uppercase tracking-[0.12em] shadow-md transition hover:bg-[#ff9f26] hover:shadow-lg";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full px-2 py-1 text-[11px] shadow-sm ${baseCard}`}
      >
        В корзину
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
        className={`mt-4 w-full px-4 py-3 text-center text-sm shadow-md ${basePage}`}
    >
      В корзину
    </button>
  );
}
