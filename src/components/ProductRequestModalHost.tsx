"use client";

import ProductRequestForm from "./ProductRequestForm";
import { useProductRequestStore } from "@/store/productRequest";

export default function ProductRequestModalHost() {
  const { isOpen, type, productName, productId, productSku, close } =
    useProductRequestStore();

  if (!isOpen) return null;

  return (
    <ProductRequestForm
      type={type}
      productName={productName}
      productId={productId}
      productSku={productSku}
      onClose={close}
    />
  );
}

