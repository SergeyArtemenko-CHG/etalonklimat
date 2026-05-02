import { create } from "zustand";

type FilterStore = {
  inStockOnly: boolean;
  fuelTypes: string[];
  brands: string[];
  categories: string[];
  subCategories: string[];
  numericRanges: Record<string, { min: number | null; max: number | null }>;
  specTextFilters: Record<string, string[]>;
  powerMin: number | null;
  powerMax: number | null;
  boilerTypes: string[];
  heatExchangerMaterials: string[];
  boilerPowerMin: number | null;
  boilerPowerMax: number | null;
  steamOutputMin: number | null;
  steamOutputMax: number | null;
  workingPressureMin: number | null;
  workingPressureMax: number | null;
  setInStockOnly: (value: boolean) => void;
  setFuelTypes: (values: string[]) => void;
  toggleFuelType: (value: string) => void;
  setBrands: (values: string[]) => void;
  toggleBrand: (value: string) => void;
  setCategories: (values: string[]) => void;
  toggleCategory: (value: string) => void;
  setSubCategories: (values: string[]) => void;
  toggleSubCategory: (value: string) => void;
  setPowerMin: (value: number | null) => void;
  setPowerMax: (value: number | null) => void;
  setPowerRange: (min: number, max: number) => void;
  setBoilerPowerRange: (min: number | null, max: number | null) => void;
  setSteamOutputRange: (min: number | null, max: number | null) => void;
  setWorkingPressureRange: (min: number | null, max: number | null) => void;
  toggleBoilerType: (value: string) => void;
  toggleHeatExchangerMaterial: (value: string) => void;
  setNumericRange: (
    key: string,
    min: number | null,
    max: number | null
  ) => void;
  clearMissingNumericRanges: (keys: string[]) => void;
  toggleSpecTextValue: (key: string, value: string) => void;
  clearMissingSpecTextFilters: (keys: string[]) => void;
  resetFilters: () => void;
};

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  if (Array.isArray(obj)) {
    obj.forEach(deepFreeze);
  } else {
    Object.values(obj).forEach(deepFreeze);
  }
  return obj;
}

const initialState = deepFreeze({
  inStockOnly: false,
  fuelTypes: [] as string[],
  brands: [] as string[],
  categories: [] as string[],
  subCategories: [] as string[],
  numericRanges: {} as Record<string, { min: number | null; max: number | null }>,
  specTextFilters: {} as Record<string, string[]>,
  powerMin: null as number | null,
  powerMax: null as number | null,
  boilerTypes: [] as string[],
  heatExchangerMaterials: [] as string[],
  boilerPowerMin: null as number | null,
  boilerPowerMax: null as number | null,
  steamOutputMin: null as number | null,
  steamOutputMax: null as number | null,
  workingPressureMin: null as number | null,
  workingPressureMax: null as number | null,
});

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,

  setInStockOnly: (value) => set({ inStockOnly: value }),

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

  setCategories: (values) => set({ categories: values }),

  toggleCategory: (value) =>
    set((state) => ({
      categories: state.categories.includes(value)
        ? state.categories.filter((v) => v !== value)
        : [...state.categories, value],
    })),

  setSubCategories: (values) => set({ subCategories: values }),

  toggleSubCategory: (value) =>
    set((state) => ({
      subCategories: state.subCategories.includes(value)
        ? state.subCategories.filter((v) => v !== value)
        : [...state.subCategories, value],
    })),

  setPowerMin: (value) => set({ powerMin: value }),

  setPowerMax: (value) => set({ powerMax: value }),

  setPowerRange: (min, max) => set({ powerMin: min, powerMax: max }),

  setBoilerPowerRange: (min, max) =>
    set({ boilerPowerMin: min, boilerPowerMax: max }),

  setSteamOutputRange: (min, max) =>
    set({ steamOutputMin: min, steamOutputMax: max }),

  setWorkingPressureRange: (min, max) =>
    set({ workingPressureMin: min, workingPressureMax: max }),

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

  setNumericRange: (key, min, max) =>
    set((state) => ({
      numericRanges: {
        ...state.numericRanges,
        [key]: { min, max },
      },
    })),

  clearMissingNumericRanges: (keys) =>
    set((state) => {
      const allowed = new Set(keys);
      const next = Object.fromEntries(
        Object.entries(state.numericRanges).filter(([k]) => allowed.has(k))
      );
      if (Object.keys(next).length === Object.keys(state.numericRanges).length) {
        return state;
      }
      return { numericRanges: next };
    }),

  toggleSpecTextValue: (key, value) =>
    set((state) => {
      const current = state.specTextFilters[key] ?? [];
      const nextValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const next = { ...state.specTextFilters, [key]: nextValues };
      if (nextValues.length === 0) delete next[key];
      return { specTextFilters: next };
    }),

  clearMissingSpecTextFilters: (keys) =>
    set((state) => {
      const allowed = new Set(keys);
      const next = Object.fromEntries(
        Object.entries(state.specTextFilters).filter(([k]) => allowed.has(k))
      );
      if (Object.keys(next).length === Object.keys(state.specTextFilters).length) {
        return state;
      }
      return { specTextFilters: next };
    }),

  resetFilters: () =>
    set((state) => {
      const alreadyEmpty =
        !state.inStockOnly &&
        state.powerMin == null &&
        state.powerMax == null &&
        state.boilerPowerMin == null &&
        state.boilerPowerMax == null &&
        state.steamOutputMin == null &&
        state.steamOutputMax == null &&
        state.workingPressureMin == null &&
        state.workingPressureMax == null &&
        state.fuelTypes.length === 0 &&
        state.brands.length === 0 &&
        state.categories.length === 0 &&
        state.subCategories.length === 0 &&
        Object.keys(state.numericRanges).length === 0 &&
        Object.keys(state.specTextFilters).length === 0 &&
        state.boilerTypes.length === 0 &&
        state.heatExchangerMaterials.length === 0;
      if (alreadyEmpty) return state;
      return initialState;
    }),
}));
