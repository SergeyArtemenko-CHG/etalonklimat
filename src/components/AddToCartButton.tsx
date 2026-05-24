"use client";

import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";

type AddToCartButtonProps = {
  id: string;
  name: string;
  sku?: string;
  image?: string;
  priceEur?: number;
  priceRub?: number;
  quantity?: number;
  variant?: "card" | "page";
  sharpCorners?: boolean;
};

export default function AddToCartButton({
  id,
  name,
  sku,
  image,
  priceEur,
  priceRub,
  quantity = 1,
  variant = "card",
  sharpCorners = false,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const handleClick = () => {
    addItem({ id, name, sku, image, priceEur, priceRub, quantity });
    addToast(`Товар «${name}» добавлен в корзину`);
  };

  const baseCard = `flex items-center justify-center ${
    sharpCorners ? "rounded-none" : "rounded-lg"
  } bg-accent text-white font-semibold shadow-md transition hover:bg-accent-hover hover:shadow-lg`;
  const basePage =
    "rounded-xl bg-accent text-white font-semibold uppercase tracking-[0.12em] shadow-md transition hover:bg-accent-hover hover:shadow-lg";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full px-2 py-1.5 text-[11px] shadow-sm ${baseCard}`}
      >
        Купить
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
