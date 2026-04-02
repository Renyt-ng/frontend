function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeNigerianPhone(input: string) {
  const digits = digitsOnly(input);

  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return `+234${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 13 && digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.length === 14 && digits.startsWith("0234")) {
    return `+${digits.slice(1)}`;
  }

  return null;
}

export function isValidNigerianPhone(input: string) {
  return Boolean(normalizeNigerianPhone(input));
}

export function formatNigerianPhone(input: string) {
  const normalized = normalizeNigerianPhone(input);

  if (!normalized) {
    return input.trim();
  }

  const local = normalized.slice(4);
  return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 10)}`.trim();
}

export function normalizePhoneForWhatsApp(input: string) {
  const normalized = normalizeNigerianPhone(input);
  return normalized ? normalized.replace(/\D/g, "") : input.replace(/\D/g, "");
}
