import { create } from "zustand";

type CurrencyStore = {
  rate: number;
  fetchRate: () => Promise<void>;
};

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  rate: 100,

  fetchRate: async () => {
    try {
      const res = await fetch("/api/currency/rate");
      const data = res.ok ? await res.json() : {};
      const rate = typeof data.rate === "number" ? data.rate : 100;
      set({ rate });
        fetch("/api/system/rate-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      }).catch(() => {});
    } catch {
      set({ rate: 100 });
    }
  },
}));
