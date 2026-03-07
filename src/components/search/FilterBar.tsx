"use client";

import { useSearchStore } from "@/stores/searchStore";
import { Select } from "@/components/ui";
import { PROPERTY_TYPE_LABELS, PRICE_RANGES } from "@/lib/utils";
import type { PropertyType } from "@/types";

export function FilterBar() {
  const {
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    setPropertyType,
    setPriceRange,
    setBedrooms,
    resetFilters,
  } = useSearchStore();

  const propertyTypeOptions = [
    ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

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
      <Select
        options={propertyTypeOptions}
        placeholder="Property Type"
        value={propertyType}
        onChange={(e) =>
          setPropertyType((e.target.value || "") as PropertyType | "")
        }
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

      {(propertyType || minPrice || bedrooms) && (
        <button
          onClick={resetFilters}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-100 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
