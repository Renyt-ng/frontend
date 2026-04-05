"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Building2, MapPin, Search } from "lucide-react";
import { Button, MultiSelect, Select } from "@/components/ui";
import {
  appendPropertyTypeParams,
  PRICE_RANGES,
  cn,
} from "@/lib/utils";
import { useLocations, usePropertyTypes } from "@/lib/hooks";
import type { PropertyListingPurpose, PropertyType } from "@/types";

const PURPOSE_OPTIONS: Array<{ value: PropertyListingPurpose; label: string }> = [
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
];

const BEDROOM_OPTIONS = [
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4+ Bedrooms" },
];

const PRICE_OPTIONS = PRICE_RANGES.map((range, index) => ({
  value: String(index),
  label: range.label,
}));

export function HeroSearchPanel() {
  const router = useRouter();
  const propertyTypesQuery = usePropertyTypes();
  const [listingPurpose, setListingPurpose] = useState<PropertyListingPurpose>("sale");
  const [area, setArea] = useState("");
  const [locationSlug, setLocationSlug] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [bedrooms, setBedrooms] = useState<string>("");
  const [priceIndex, setPriceIndex] = useState("");
  const deferredArea = useDeferredValue(area.trim());
  const locationsQuery = useLocations({
    q: deferredArea || undefined,
    kind: "all",
    limit: deferredArea ? 8 : 0,
  });
  const propertyTypeOptions = (propertyTypesQuery.data?.data ?? []).map((type) => ({
    value: type.slug,
    label: type.label,
  }));
  const filteredAreas = locationsQuery.data?.data ?? [];

  function pushSearch() {
    const params = new URLSearchParams();

    if (area.trim()) {
      params.set("area", area.trim());
    }

    if (locationSlug) {
      params.set("location_slug", locationSlug);
    }

    if (listingPurpose !== "rent") {
      params.set("listing_purpose", listingPurpose);
    }

    appendPropertyTypeParams(params, propertyTypes);

    if (bedrooms) {
      params.set("bedrooms", bedrooms);
    }

    if (priceIndex && PRICE_RANGES[Number(priceIndex)]) {
      const range = PRICE_RANGES[Number(priceIndex)];
      params.set("min_price", String(range.min));

      if (range.max !== Infinity) {
        params.set("max_price", String(range.max));
      }
    }

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setShowSuggestions(false);
    pushSearch();
  }

  function selectArea(selectedArea: string, selectedLocationSlug: string) {
    setArea(selectedArea);
    setLocationSlug(selectedLocationSlug);
    setShowSuggestions(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/70 bg-white/95 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-4"
    >
      <div
        className="grid grid-cols-2 gap-2 rounded-full bg-[var(--color-emerald)]/18 p-1.5 sm:inline-flex sm:w-auto"
        role="tablist"
        aria-label="Browse by purpose"
      >
        {PURPOSE_OPTIONS.map((option) => {
          const active = listingPurpose === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setListingPurpose(option.value)}
              className={cn(
                "rounded-full px-5 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--color-deep-slate-blue)] text-white shadow-sm"
                  : "text-[var(--color-text-primary)] hover:bg-white/60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[1.75rem] border border-[var(--color-border)] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4">
        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 shadow-sm">
            <MapPin className="h-5 w-5 flex-shrink-0 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={area}
              onChange={(event) => {
                setArea(event.target.value);
                setLocationSlug("");
                setShowSuggestions(event.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSuggestions(area.trim().length > 0)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 180);
              }}
              placeholder="City, area, neighbourhood..."
              className="search-field-reset w-full border-0 bg-transparent text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </div>

          {showSuggestions && area.trim().length > 0 && filteredAreas.length > 0 ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
              <div className="max-h-64 overflow-y-auto p-2">
                {filteredAreas.map((entry) => (
                  <button
                    key={entry.slug}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectArea(entry.name, entry.slug)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-slate-50"
                  >
                    <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <span>{entry.display_name}</span>
                    <span className="ml-auto text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                      {entry.kind}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <MultiSelect
              options={propertyTypeOptions}
              value={propertyTypes}
              onChange={(nextValue) => setPropertyTypes(nextValue as PropertyType[])}
              emptyLabel="Property Type"
              className="pl-11 text-sm"
            />
          </div>

          <div className="relative">
            <BedDouble className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Select
              options={BEDROOM_OPTIONS}
              placeholder="Bedrooms"
              value={bedrooms}
              onChange={(event) => setBedrooms(event.target.value)}
              className="pl-11 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 sm:max-w-[320px]">
          <Select
            options={PRICE_OPTIONS}
            placeholder="Price Range"
            value={priceIndex}
            onChange={(event) => setPriceIndex(event.target.value)}
            className="text-sm"
          />
        </div>

        <Button type="submit" size="lg" className="mt-4 h-14 w-full rounded-full text-lg font-semibold">
          <Search className="h-5 w-5" />
          Search
        </Button>
      </div>
    </form>
  );
}