import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  APP_TAGLINE,
  COLORS,
  PROPERTY_TYPE_LABELS,
  PRICE_RANGES,
  DEFAULT_PAGE_SIZE,
} from "@/lib/utils/constants";

describe("constants", () => {
  it("exports APP_NAME as 'Renyt'", () => {
    expect(APP_NAME).toBe("Renyt");
  });

  it("exports a tagline", () => {
    expect(APP_TAGLINE).toBeTruthy();
    expect(typeof APP_TAGLINE).toBe("string");
  });

  it("has required design token colors", () => {
    expect(COLORS.deepSlateBlue).toBe("#1E3A5F");
    expect(COLORS.emerald).toBe("#10B981");
    expect(COLORS.background).toBe("#F9FAFB");
  });

  it("has 6 property type labels", () => {
    expect(Object.keys(PROPERTY_TYPE_LABELS)).toHaveLength(6);
    expect(PROPERTY_TYPE_LABELS.apartment).toBe("Apartment");
    expect(PROPERTY_TYPE_LABELS.selfcontain).toBe("Self Contain");
  });

  it("has sequential price ranges", () => {
    expect(PRICE_RANGES.length).toBeGreaterThan(0);
    for (let i = 1; i < PRICE_RANGES.length; i++) {
      expect(PRICE_RANGES[i].min).toBe(PRICE_RANGES[i - 1].max);
    }
  });

  it("has default page size of 24", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(24);
  });
});
