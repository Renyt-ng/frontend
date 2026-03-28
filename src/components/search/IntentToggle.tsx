"use client";

import { Button } from "@/components/ui";
import { useSearchStore } from "@/stores/searchStore";
import type { PropertyListingPurpose } from "@/types";

const OPTIONS: Array<{ value: PropertyListingPurpose; label: string }> = [
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
];

export function IntentToggle() {
  const listingPurpose = useSearchStore((state) => state.listingPurpose);
  const setListingPurpose = useSearchStore((state) => state.setListingPurpose);

  return (
    <div
      className="inline-flex w-full rounded-xl border border-[var(--color-border)] bg-white p-1 sm:w-auto"
      role="tablist"
      aria-label="Browse listings by purpose"
    >
      {OPTIONS.map((option) => {
        const active = listingPurpose === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "primary" : "ghost"}
            size="sm"
            className="flex-1 rounded-lg sm:min-w-28"
            onClick={() => setListingPurpose(option.value)}
            role="tab"
            aria-selected={active}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}