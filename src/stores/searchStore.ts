import { create } from "zustand";
import type { PropertyListingPurpose, PropertyType } from "@/types";

interface SearchState {
  /** Current search filters */
  area: string;
  locationSlug: string;
  listingPurpose: PropertyListingPurpose;
  propertyTypes: PropertyType[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  sortBy: "rent_amount" | "created_at";
  sortOrder: "asc" | "desc";
  page: number;

  /** Actions */
  setArea: (area: string) => void;
  setLocation: (area: string, locationSlug?: string) => void;
  setListingPurpose: (purpose: PropertyListingPurpose) => void;
  setPropertyTypes: (types: PropertyType[]) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setBedrooms: (beds?: number) => void;
  setBathrooms: (baths?: number) => void;
  setSort: (by: "rent_amount" | "created_at", order: "asc" | "desc") => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const INITIAL_STATE = {
  area: "",
  locationSlug: "",
  listingPurpose: "rent" as const,
  propertyTypes: [] as PropertyType[],
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

  setArea: (area) => set({ area, locationSlug: "", page: 1 }),
  setLocation: (area, locationSlug = "") =>
    set({ area, locationSlug, page: 1 }),
  setListingPurpose: (listingPurpose) =>
    set({ listingPurpose, minPrice: undefined, maxPrice: undefined, page: 1 }),
  setPropertyTypes: (propertyTypes) => set({ propertyTypes, page: 1 }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice, page: 1 }),
  setBedrooms: (bedrooms) => set({ bedrooms, page: 1 }),
  setBathrooms: (bathrooms) => set({ bathrooms, page: 1 }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(INITIAL_STATE),
}));
