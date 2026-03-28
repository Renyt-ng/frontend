import {
  formatNumericInput,
  formatNumericValue,
  getCaretPositionFromDigitCount,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/lib/numericInput";

describe("numericInput", () => {
  it("allows clearing a numeric value", () => {
    expect(sanitizeNumericInput("", { allowDecimal: false })).toBe("");
    expect(parseNumericInput("")).toBeNull();
  });

  it("formats currency values with grouping", () => {
    expect(formatNumericInput("1500000", { useGrouping: true })).toBe("1,500,000");
    expect(formatNumericValue(250000, { useGrouping: true })).toBe("250,000");
  });

  it("preserves decimal typing state", () => {
    expect(sanitizeNumericInput("12.5%", { allowDecimal: true })).toBe("12.5");
    expect(formatNumericInput("12.", { allowDecimal: true })).toBe("12.");
  });

  it("maps digit count back to grouped caret position", () => {
    expect(getCaretPositionFromDigitCount("1,500,000", 4)).toBe(5);
  });
});