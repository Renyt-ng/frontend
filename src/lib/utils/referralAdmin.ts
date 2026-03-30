import type {
  ListingFreshnessPolicy,
  ReferralClosureStatus,
} from "@/types";

export function getReferralCloseStatusLabel(
  status: ReferralClosureStatus | null | undefined,
) {
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
      return "Outcome not recorded";
  }
}

export function formatListingFreshnessPolicySummary(
  policy: Pick<
    ListingFreshnessPolicy,
    | "fresh_window_days"
    | "confirmation_grace_days"
    | "reminder_start_days"
    | "reminder_interval_days"
    | "auto_mark_unavailable"
  >,
) {
  const staleBehavior = policy.auto_mark_unavailable
    ? "auto-hide stale listings after the grace period"
    : "keep stale listings in confirmation due until an agent updates them";

  return `Listings stay fresh for ${policy.fresh_window_days} days, enter confirmation due for ${policy.confirmation_grace_days} days, start reminders after ${policy.reminder_start_days} days, repeat reminders every ${policy.reminder_interval_days} days, and ${staleBehavior}.`;
}

export function getIneligibleReasonLabel(reason: string | null | undefined) {
  switch (reason) {
    case "closed_off_platform":
      return "Closed off-platform";
    case "listing_unavailable":
      return "Listing unavailable";
    case "listing_archived":
      return "Listing archived";
    case "non_winning_contact":
      return "Non-winning contact";
    case "matched_account_has_no_referral":
      return "Matched account had no referral";
    default:
      return "Automatically closed";
  }
}