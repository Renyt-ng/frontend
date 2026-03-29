import { describe, expect, it } from "vitest";
import {
  formatListingFreshnessPolicySummary,
  getReferralCloseStatusLabel,
} from "@/lib/utils";

describe("referral admin utilities", () => {
  it("returns explicit Renyt and off-platform close labels", () => {
    expect(getReferralCloseStatusLabel("rented_renyt")).toBe("Rented via Renyt");
    expect(getReferralCloseStatusLabel("sold_off_platform")).toBe(
      "Sold off-platform",
    );
  });

  it("summarizes freshness policy behavior in plain language", () => {
    expect(
      formatListingFreshnessPolicySummary({
        fresh_window_days: 14,
        confirmation_grace_days: 7,
        reminder_start_days: 10,
        reminder_interval_days: 2,
        auto_mark_unavailable: true,
      }),
    ).toContain("Listings stay fresh for 14 days");
  });
});