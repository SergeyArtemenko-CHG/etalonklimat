import { create } from "zustand";
import type { RequestType } from "@/components/ProductRequestForm";

type ProductRequestState = {
  isOpen: boolean;
  type: RequestType;
  productName: string;
  productId?: string;
  productSku?: string;
  open: (payload: {
    type: RequestType;
    productName: string;
    productId?: string;
    productSku?: string;
  }) => void;
  close: () => void;
};

export const useProductRequestStore = create<ProductRequestState>((set) => ({
  isOpen: false,
  type: "price",
  productName: "",
  productId: undefined,
  productSku: undefined,
  open: ({ type, productName, productId, productSku }) =>
    set({
      isOpen: true,
      type,
      productName,
      productId,
      productSku,
    }),
  close: () =>
    set({
      isOpen: false,
      productName: "",
      productId: undefined,
      productSku: undefined,
    }),
}));

