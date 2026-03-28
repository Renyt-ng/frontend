export interface NumericInputFormatOptions {
  allowDecimal?: boolean;
  useGrouping?: boolean;
}

export function sanitizeNumericInput(
  value: string,
  options: NumericInputFormatOptions = {},
): string {
  const { allowDecimal = false } = options;
  const sanitized = value.replace(allowDecimal ? /[^\d.]/g : /\D/g, "");

  if (!allowDecimal) {
    return sanitized;
  }

  const [integerPart = "", ...decimalParts] = sanitized.split(".");
  if (decimalParts.length === 0) {
    return sanitized;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

export function formatNumericInput(
  value: string,
  options: NumericInputFormatOptions = {},
): string {
  const { allowDecimal = false, useGrouping = false } = options;

  if (!value) {
    return "";
  }

  if (!allowDecimal) {
    return useGrouping ? formatGroupedInteger(value) : value;
  }

  const hasTrailingDecimal = value.endsWith(".");
  const [integerPart = "", decimalPart] = value.split(".");
  const formattedInteger = useGrouping
    ? formatGroupedInteger(integerPart)
    : integerPart;

  if (hasTrailingDecimal) {
    return `${formattedInteger}.`;
  }

  if (decimalPart == null) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart}`;
}

export function formatNumericValue(
  value: number | null | undefined,
  options: NumericInputFormatOptions = {},
): string {
  if (value == null || Number.isNaN(value)) {
    return "";
  }

  return formatNumericInput(String(value), options);
}

export function parseNumericInput(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

export function getCaretPositionFromDigitCount(
  value: string,
  digitCount: number,
): number {
  if (digitCount <= 0) {
    return 0;
  }

  let seenDigits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index] ?? "")) {
      seenDigits += 1;
      if (seenDigits === digitCount) {
        return index + 1;
      }
    }
  }

  return value.length;
}

function formatGroupedInteger(value: string): string {
  const normalized = value.replace(/^0+(\d)/, "$1");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}