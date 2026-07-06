"use client";

import { useProductRequestStore } from "@/store/productRequest";

type Props = {
  name: string;
  id: string;
  sku: string;
};

export default function ProductDiscountButton({ name, id, sku }: Props) {
  const openRequestModal = useProductRequestStore((s) => s.open);
  return (
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
      className="max-w-[220px] shrink-0 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold leading-snug text-white shadow-md transition hover:bg-emerald-700"
    >
      Получить индивидуальную скидку
    </button>
  );
}
