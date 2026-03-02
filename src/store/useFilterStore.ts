import { create } from "zustand";

type FilterStore = {
  fuelTypes: string[];
  brands: string[];
  powerMin: number | null;
  powerMax: number | null;
  boilerTypes: string[];
  heatExchangerMaterials: string[];
  setFuelTypes: (values: string[]) => void;
  toggleFuelType: (value: string) => void;
  setBrands: (values: string[]) => void;
  toggleBrand: (value: string) => void;
  setPowerMin: (value: number | null) => void;
  setPowerMax: (value: number | null) => void;
  setPowerRange: (min: number, max: number) => void;
  toggleBoilerType: (value: string) => void;
  toggleHeatExchangerMaterial: (value: string) => void;
  resetFilters: () => void;
};

const initialState = {
  fuelTypes: [] as string[],
  brands: [] as string[],
  powerMin: null as number | null,
  powerMax: null as number | null,
  boilerTypes: [] as string[],
  heatExchangerMaterials: [] as string[],
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,

  setFuelTypes: (values) => set({ fuelTypes: values }),

  toggleFuelType: (value) =>
    set((state) => ({
      fuelTypes: state.fuelTypes.includes(value)
        ? state.fuelTypes.filter((v) => v !== value)
        : [...state.fuelTypes, value],
    })),

  setBrands: (values) => set({ brands: values }),

  toggleBrand: (value) =>
    set((state) => ({
      brands: state.brands.includes(value)
        ? state.brands.filter((v) => v !== value)
        : [...state.brands, value],
    })),

  setPowerMin: (value) => set({ powerMin: value }),

  setPowerMax: (value) => set({ powerMax: value }),

  setPowerRange: (min, max) => set({ powerMin: min, powerMax: max }),

  toggleBoilerType: (value) =>
    set((state) => ({
      boilerTypes: state.boilerTypes.includes(value)
        ? state.boilerTypes.filter((v) => v !== value)
        : [...state.boilerTypes, value],
    })),

  toggleHeatExchangerMaterial: (value) =>
    set((state) => ({
      heatExchangerMaterials: state.heatExchangerMaterials.includes(value)
        ? state.heatExchangerMaterials.filter((v) => v !== value)
        : [...state.heatExchangerMaterials, value],
    })),

  resetFilters: () => set(initialState),
}));
