import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  priceEur?: number;
  priceRub?: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: {
    id: string;
    name: string;
    priceEur?: number;
    priceRub?: number;
    quantity?: number;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPriceEur: () => number;
  getTotalPriceRub: (rate: number) => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ id, name, priceEur, priceRub, quantity = 1 }) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return {
            items: [...state.items, { id, name, priceEur, priceRub, quantity }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      getTotalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getTotalPriceEur: () => {
        return get().items.reduce(
          (sum, i) => sum + (i.priceEur ?? 0) * i.quantity,
          0
        );
      },

      getTotalPriceRub: (rate: number) => {
        return get().items.reduce((sum, i) => {
          if (i.priceRub != null && i.priceRub > 0) {
            return sum + i.priceRub * i.quantity;
          }
          return sum + (i.priceEur ?? 0) * rate * i.quantity;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
