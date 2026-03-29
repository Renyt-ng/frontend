import type { Property, PropertyListingPurpose, PropertyStatus } from "@/types";
import { getPropertyFreshnessState } from "./listingFreshness";

export type ListingHealthGroup =
  | "publishing"
  | "needs_confirmation"
  | "active"
  | "final_outcomes"
  | "unavailable"
  | "archived"
  | "draft";

const RENT_FINAL_OUTCOMES: PropertyStatus[] = [
  "rented_renyt",
  "rented_off_platform",
];

const SALE_FINAL_OUTCOMES: PropertyStatus[] = [
  "sold_renyt",
  "sold_off_platform",
];

export function isPropertyFinalOutcomeStatus(status: PropertyStatus) {
  return [...RENT_FINAL_OUTCOMES, ...SALE_FINAL_OUTCOMES].includes(status);
}

export function getPropertyFinalOutcomeLabel(status: PropertyStatus) {
  switch (status) {
    case "rented_renyt":
      return "Rented via Renyt";
    case "rented_off_platform":
      return "Rented off-platform";
    case "sold_renyt":
      return "Sold via Renyt";
    case "sold_off_platform":
      return "Sold off-platform";
    default:
      return null;
  }
}

export function getOutcomeActions(listingPurpose: PropertyListingPurpose) {
  if (listingPurpose === "sale") {
    return [
      { status: "sold_renyt" as const, label: "Mark sold via Renyt" },
      { status: "sold_off_platform" as const, label: "Mark sold off-platform" },
    ];
  }

  return [
    { status: "rented_renyt" as const, label: "Mark rented via Renyt" },
    { status: "rented_off_platform" as const, label: "Mark rented off-platform" },
  ];
}

export function getListingHealthGroup(
  property: Pick<Property, "status" | "availability_confirmed_at" | "freshness_state">,
): ListingHealthGroup {
  if (property.status === "publishing") {
    return "publishing";
  }

  if (property.status === "draft") {
    return "draft";
  }

  if (property.status === "archived") {
    return "archived";
  }

  if (property.status === "unavailable") {
    return "unavailable";
  }

  if (isPropertyFinalOutcomeStatus(property.status)) {
    return "final_outcomes";
  }

  if (getPropertyFreshnessState(property) === "confirmation_due") {
    return "needs_confirmation";
  }

  return "active";
}

export function summarizeListingHealth(properties: Property[]) {
  return properties.reduce(
    (summary, property) => {
      const group = getListingHealthGroup(property);
      summary[group] += 1;
      return summary;
    },
    {
      publishing: 0,
      needs_confirmation: 0,
      active: 0,
      final_outcomes: 0,
      unavailable: 0,
      archived: 0,
      draft: 0,
    } as Record<ListingHealthGroup, number>,
  );
}