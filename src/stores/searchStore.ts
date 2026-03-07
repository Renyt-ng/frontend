import { create } from "zustand";
import type { PropertyType } from "@/types";

interface SearchState {
  /** Current search filters */
  area: string;
  propertyType: PropertyType | "";
  minPrice: number | undefined;
  maxPrice: number | undefined;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  sortBy: "rent_amount" | "created_at";
  sortOrder: "asc" | "desc";
  page: number;

  /** Actions */
  setArea: (area: string) => void;
  setPropertyType: (type: PropertyType | "") => void;
  setPriceRange: (min?: number, max?: number) => void;
  setBedrooms: (beds?: number) => void;
  setBathrooms: (baths?: number) => void;
  setSort: (by: "rent_amount" | "created_at", order: "asc" | "desc") => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const INITIAL_STATE = {
  area: "",
  propertyType: "" as const,
  minPrice: undefined,
  maxPrice: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  sortBy: "created_at" as const,
  sortOrder: "desc" as const,
  page: 1,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...INITIAL_STATE,

  setArea: (area) => set({ area, page: 1 }),
  setPropertyType: (propertyType) => set({ propertyType, page: 1 }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice, page: 1 }),
  setBedrooms: (bedrooms) => set({ bedrooms, page: 1 }),
  setBathrooms: (bathrooms) => set({ bathrooms, page: 1 }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(INITIAL_STATE),
}));
