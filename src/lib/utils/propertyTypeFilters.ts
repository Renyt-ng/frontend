import type { PropertyType } from "@/types";

export function normalizePropertyTypes(
  input: string | string[] | undefined,
): PropertyType[] {
  const rawValues = Array.isArray(input) ? input : input ? [input] : [];
  const values = rawValues.flatMap((entry) =>
    entry
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return Array.from(new Set(values));
}

export function appendPropertyTypeParams(
  params: URLSearchParams,
  propertyTypes: PropertyType[],
) {
  for (const propertyType of propertyTypes) {
    params.append("property_type", propertyType);
  }
}

export function serializePropertyTypes(propertyTypes: PropertyType[]) {
  return propertyTypes.length > 0 ? propertyTypes.join(",") : undefined;
}