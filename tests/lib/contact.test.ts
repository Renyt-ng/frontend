import { describe, expect, it } from "vitest";
import {
  buildAbsoluteSiteUrl,
  buildPropertyWhatsAppMessage,
  buildWhatsAppHref,
  normalizePhoneForWhatsApp,
} from "@/lib/utils";

describe("contact utils", () => {
  it("normalizes phone numbers for WhatsApp links", () => {
    expect(normalizePhoneForWhatsApp("+234 803 000 0000")).toBe("2348030000000");
  });

  it("normalizes local Nigerian numbers for WhatsApp links", () => {
    expect(normalizePhoneForWhatsApp("0803 000 0000")).toBe("2348030000000");
  });

  it("builds a WhatsApp href with encoded text", () => {
    expect(buildWhatsAppHref("+234 803 000 0000", "Hi there")).toBe(
      "https://wa.me/2348030000000?text=Hi%20there",
    );
  });

  it("builds an absolute site url for property sharing", () => {
    expect(buildAbsoluteSiteUrl("/properties/property-1")).toBe(
      "https://renyt.ng/properties/property-1",
    );
  });

  it("includes the shareable property url in the WhatsApp message", () => {
    expect(
      buildPropertyWhatsAppMessage({
        title: "2 Bedroom Flat",
        area: "Yaba",
        propertyUrl: "https://renyt.ng/properties/property-1",
      }),
    ).toContain("https://renyt.ng/properties/property-1");
  });
});