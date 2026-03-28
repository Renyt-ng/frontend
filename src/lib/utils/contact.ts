export function normalizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppHref(phone: string, text?: string) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const base = `https://wa.me/${normalizedPhone}`;

  if (!text?.trim()) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(text.trim())}`;
}