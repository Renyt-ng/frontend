"use client";

import { useSearchStore } from "@/stores/searchStore";
import { MultiSelect, Select } from "@/components/ui";
import { usePropertyTypes } from "@/lib/hooks";
import { PRICE_RANGES } from "@/lib/utils";
import type { PropertyType } from "@/types";

export function FilterBar() {
  const propertyTypesQuery = usePropertyTypes();
  const {
    listingPurpose,
    propertyTypes,
    minPrice,
    maxPrice,
    freshOnly,
    bedrooms,
    setPropertyTypes,
    setPriceRange,
    setFreshOnly,
    setBedrooms,
    resetFilters,
  } = useSearchStore();

  const propertyTypeOptions = (propertyTypesQuery.data?.data ?? []).map((type) => ({
    value: type.slug,
    label: type.label,
  }));

  const priceOptions = PRICE_RANGES.map((r, i) => ({
    value: String(i),
    label: r.label,
  }));

  const bedroomOptions = [
    { value: "1", label: "1 Bedroom" },
    { value: "2", label: "2 Bedrooms" },
    { value: "3", label: "3 Bedrooms" },
    { value: "4", label: "4+ Bedrooms" },
  ];

  const currentPriceIndex = PRICE_RANGES.findIndex(
    (r) => r.min === minPrice && r.max === maxPrice,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MultiSelect
        options={propertyTypeOptions}
        value={propertyTypes}
        onChange={(nextValue) => setPropertyTypes(nextValue as PropertyType[])}
        emptyLabel="Any"
        className="h-10 min-w-[150px] rounded-lg text-sm"
      />

      <Select
        options={priceOptions}
        placeholder="Price Range"
        value={currentPriceIndex >= 0 ? String(currentPriceIndex) : ""}
        onChange={(e) => {
          const idx = Number(e.target.value);
          if (!isNaN(idx) && PRICE_RANGES[idx]) {
            const range = PRICE_RANGES[idx];
            setPriceRange(
              range.min,
              range.max === Infinity ? undefined : range.max,
            );
          } else {
            setPriceRange(undefined, undefined);
          }
        }}
        className="h-10 min-w-[140px] rounded-lg text-sm"
      />

      <Select
        options={bedroomOptions}
        placeholder="Bedrooms"
        value={bedrooms ? String(bedrooms) : ""}
        onChange={(e) =>
          setBedrooms(e.target.value ? Number(e.target.value) : undefined)
        }
        className="h-10 min-w-[130px] rounded-lg text-sm"
      />

      <button
        type="button"
        onClick={() => setFreshOnly(!freshOnly)}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          freshOnly
            ? "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)] text-white"
            : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-gray-50"
        }`}
      >
        Fresh listings
      </button>

      {(propertyTypes.length > 0 || minPrice || bedrooms || freshOnly) && (
        <button
          onClick={resetFilters}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-100 transition-colors"
        >
          Clear filters
        </button>
      )}

      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
        {listingPurpose === "sale" ? "Sale pricing" : "Rental pricing"}
      </span>
    </div>
  );
}
