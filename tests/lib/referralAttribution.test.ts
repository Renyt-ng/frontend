import { beforeEach, describe, expect, it } from "vitest";
import {
  clearReferralAttribution,
  getReferralAttribution,
  persistReferralAttribution,
} from "@/lib/referrals/attribution";

const STORAGE_KEY = "renyt:referral-attribution";

describe("referral attribution storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and retrieves a referral code per property", () => {
    persistReferralAttribution("property-1", "ref123");

    expect(getReferralAttribution("property-1")).toBe("REF123");
  });

  it("clears stored attribution for a property", () => {
    persistReferralAttribution("property-1", "ref123");
    clearReferralAttribution("property-1");

    expect(getReferralAttribution("property-1")).toBeNull();
  });

  it("drops stale stored attribution when reading the store", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "property-1": {
          propertyId: "property-1",
          referralCode: "OLD123",
          capturedAt: Date.now() - 1000 * 60 * 60 * 24 * 31,
        },
      }),
    );

    expect(getReferralAttribution("property-1")).toBeNull();
  });
});