import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatRelativeTime,
  capitalize,
  formatPropertyPriceLabel,
  formatPropertyType,
  slugify,
} from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formats basic naira amount", () => {
    const result = formatCurrency(1500000);
    expect(result).toContain("1,500,000");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("handles fractional amounts", () => {
    const result = formatCurrency(999.5);
    expect(result).toBeTruthy();
  });
});

describe("formatCurrencyCompact", () => {
  it("formats millions as M", () => {
    const result = formatCurrencyCompact(2500000);
    expect(result).toMatch(/2\.5M/);
  });

  it("formats thousands as K", () => {
    const result = formatCurrencyCompact(500000);
    expect(result).toMatch(/500K/);
  });

  it("handles small numbers", () => {
    const result = formatCurrencyCompact(100);
    expect(result).toBeTruthy();
  });
});

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    const result = formatDate("2025-06-15T10:00:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles already capitalized", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });
});

describe("formatPropertyType", () => {
  it("maps selfcontain to Self Contain", () => {
    expect(formatPropertyType("selfcontain")).toBe("Self Contain");
  });

  it("maps known types correctly", () => {
    expect(formatPropertyType("apartment")).toBe("Apartment");
    expect(formatPropertyType("duplex")).toBe("Duplex");
  });

  it("capitalizes unknown types", () => {
    expect(formatPropertyType("villa")).toBe("Villa");
  });
});

describe("formatPropertyPriceLabel", () => {
  it("uses per night for shortlet rent pricing", () => {
    expect(
      formatPropertyPriceLabel({
        listingPurpose: "rent",
        propertyType: "shortlet",
        rentAmount: 85000,
      }),
    ).toEqual({
      amount: expect.stringContaining("85,000"),
      qualifier: "per night",
    });
  });

  it("keeps per year for non-shortlet rent pricing", () => {
    expect(
      formatPropertyPriceLabel({
        listingPurpose: "rent",
        propertyType: "apartment",
        rentAmount: 8500000,
      }).qualifier,
    ).toBe("per year");
  });
});

describe("slugify", () => {
  it("converts to lowercase kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("trims dashes", () => {
    expect(slugify("  hello  world  ")).toBe("hello-world");
  });
});
