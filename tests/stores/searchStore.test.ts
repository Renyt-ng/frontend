import { describe, it, expect, beforeEach } from "vitest";
import { useSearchStore } from "@/stores/searchStore";

describe("searchStore", () => {
  beforeEach(() => {
    useSearchStore.getState().resetFilters();
  });

  it("starts with default values", () => {
    const state = useSearchStore.getState();
    expect(state.area).toBe("");
    expect(state.propertyType).toBe("");
    expect(state.minPrice).toBeUndefined();
    expect(state.maxPrice).toBeUndefined();
    expect(state.bedrooms).toBeUndefined();
    expect(state.bathrooms).toBeUndefined();
    expect(state.sortBy).toBe("created_at");
    expect(state.sortOrder).toBe("desc");
    expect(state.page).toBe(1);
  });

  it("setArea updates area and resets page", () => {
    useSearchStore.getState().setPage(5);
    useSearchStore.getState().setArea("Lekki");
    const state = useSearchStore.getState();
    expect(state.area).toBe("Lekki");
    expect(state.page).toBe(1);
  });

  it("setPropertyType updates type and resets page", () => {
    useSearchStore.getState().setPage(3);
    useSearchStore.getState().setPropertyType("apartment");
    const state = useSearchStore.getState();
    expect(state.propertyType).toBe("apartment");
    expect(state.page).toBe(1);
  });

  it("setPriceRange sets min and max", () => {
    useSearchStore.getState().setPriceRange(500_000, 2_000_000);
    const state = useSearchStore.getState();
    expect(state.minPrice).toBe(500_000);
    expect(state.maxPrice).toBe(2_000_000);
    expect(state.page).toBe(1);
  });

  it("setBedrooms updates bedroom count", () => {
    useSearchStore.getState().setBedrooms(3);
    expect(useSearchStore.getState().bedrooms).toBe(3);
  });

  it("setSort changes sort fields", () => {
    useSearchStore.getState().setSort("rent_amount", "asc");
    const state = useSearchStore.getState();
    expect(state.sortBy).toBe("rent_amount");
    expect(state.sortOrder).toBe("asc");
  });

  it("resetFilters returns to defaults", () => {
    useSearchStore.getState().setArea("Ikoyi");
    useSearchStore.getState().setPropertyType("duplex");
    useSearchStore.getState().setPriceRange(1_000_000, 5_000_000);
    useSearchStore.getState().setPage(4);

    useSearchStore.getState().resetFilters();
    const state = useSearchStore.getState();
    expect(state.area).toBe("");
    expect(state.propertyType).toBe("");
    expect(state.minPrice).toBeUndefined();
    expect(state.page).toBe(1);
  });
});
