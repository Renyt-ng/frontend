import { describe, expect, it } from "vitest";
import {
  appendPropertyTypeParams,
  normalizePropertyTypes,
  serializePropertyTypes,
} from "@/lib/utils/propertyTypeFilters";

describe("propertyTypeFilters", () => {
  it("normalizes single and comma-separated values into a unique array", () => {
    expect(normalizePropertyTypes("apartment,duplex,apartment")).toEqual([
      "apartment",
      "duplex",
    ]);
  });

  it("supports repeated query params", () => {
    expect(normalizePropertyTypes(["apartment", "duplex"])).toEqual([
      "apartment",
      "duplex",
    ]);
  });

  it("appends one query param per selected property type", () => {
    const params = new URLSearchParams();
    appendPropertyTypeParams(params, ["apartment", "duplex"]);

    expect(params.getAll("property_type")).toEqual(["apartment", "duplex"]);
  });

  it("serializes selected property types for API requests", () => {
    expect(serializePropertyTypes(["apartment", "duplex"])).toBe(
      "apartment,duplex",
    );
    expect(serializePropertyTypes([])).toBeUndefined();
  });
});