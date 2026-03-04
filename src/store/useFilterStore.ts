import { create } from "zustand";

type FilterStore = {
  fuelTypes: string[];
  brands: string[];
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
  setFuelTypes: (values: string[]) => void;
  toggleFuelType: (value: string) => void;
  setBrands: (values: string[]) => void;
  toggleBrand: (value: string) => void;
  setPowerMin: (value: number | null) => void;
  setPowerMax: (value: number | null) => void;
  setPowerRange: (min: number, max: number) => void;
  setBoilerPowerRange: (min: number | null, max: number | null) => void;
  setSteamOutputRange: (min: number | null, max: number | null) => void;
  setWorkingPressureRange: (min: number | null, max: number | null) => void;
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
  boilerPowerMin: null as number | null,
  boilerPowerMax: null as number | null,
  steamOutputMin: null as number | null,
  steamOutputMax: null as number | null,
  workingPressureMin: null as number | null,
  workingPressureMax: null as number | null,
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

  resetFilters: () =>
    set((state) => {
      const alreadyEmpty =
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
        state.boilerTypes.length === 0 &&
        state.heatExchangerMaterials.length === 0;
      if (alreadyEmpty) return state;
      return initialState;
    }),
}));
