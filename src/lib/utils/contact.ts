import { normalizePhoneForWhatsApp } from "./phone";

export { normalizePhoneForWhatsApp };

export function buildWhatsAppHref(phone: string, text?: string) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const base = `https://wa.me/${normalizedPhone}`;

  if (!text?.trim()) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(text.trim())}`;
}

export function buildAbsoluteSiteUrl(pathname: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renyt.ng";
  return new URL(pathname, baseUrl).toString();
}

interface BuildPropertyWhatsAppMessageOptions {
  title: string;
  area: string;
  propertyUrl: string;
}

export function buildPropertyWhatsAppMessage({
  title,
  area,
  propertyUrl,
}: BuildPropertyWhatsAppMessageOptions) {
  return `Hi, I'm interested in ${title} in ${area} on Renyt. Here's the property link: ${propertyUrl}`;
}