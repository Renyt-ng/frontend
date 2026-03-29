import type { ListingFreshnessState, Property } from "@/types";
import { formatDate, formatRelativeTime } from "./format";

const INACTIVE_STATUSES = new Set([
  "unavailable",
  "archived",
  "rented_renyt",
  "rented_off_platform",
  "sold_renyt",
  "sold_off_platform",
]);

export function getPropertyFreshnessState(property: Pick<
  Property,
  "status" | "availability_confirmed_at" | "freshness_state"
>): ListingFreshnessState {
  if (property.freshness_state) {
    return property.freshness_state;
  }

  if (INACTIVE_STATUSES.has(property.status)) {
    return "unavailable";
  }

  if (property.status === "confirmation_due" || !property.availability_confirmed_at) {
    return "confirmation_due";
  }

  return "fresh";
}

export function getPropertyFreshnessLabel(property: Pick<
  Property,
  "status" | "availability_confirmed_at" | "freshness_state"
>) {
  if (property.status === "publishing") {
    return "Publishing in progress";
  }

  const state = getPropertyFreshnessState(property);

  if (state === "fresh" && property.availability_confirmed_at) {
    return `Confirmed ${formatRelativeTime(property.availability_confirmed_at)}`;
  }

  if (state === "confirmation_due") {
    return "Availability being confirmed";
  }

  return "No longer available";
}

export function getPropertyFreshnessMeta(property: Pick<
  Property,
  "status" | "availability_confirmed_at" | "freshness_state"
>) {
  if (property.status === "publishing") {
    return "Not live yet";
  }

  if (!property.availability_confirmed_at) {
    return null;
  }

  return `Last confirmed ${formatDate(property.availability_confirmed_at)}`;
}

export function getPropertyFreshnessBadgeVariant(property: Pick<
  Property,
  "status" | "availability_confirmed_at" | "freshness_state"
>) {
  const state = getPropertyFreshnessState(property);

  if (state === "fresh") {
    return "verified" as const;
  }

  if (state === "confirmation_due") {
    return "pending" as const;
  }

  return "archived" as const;
}