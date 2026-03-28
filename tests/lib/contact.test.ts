import { describe, expect, it } from "vitest";
import { buildWhatsAppHref, normalizePhoneForWhatsApp } from "@/lib/utils";

describe("contact utils", () => {
  it("normalizes phone numbers for WhatsApp links", () => {
    expect(normalizePhoneForWhatsApp("+234 803 000 0000")).toBe("2348030000000");
  });

  it("builds a WhatsApp href with encoded text", () => {
    expect(buildWhatsAppHref("+234 803 000 0000", "Hi there")).toBe(
      "https://wa.me/2348030000000?text=Hi%20there",
    );
  });
});