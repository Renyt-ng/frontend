/** Application-wide constants */

export const APP_NAME = "Renyt";
export const APP_TAGLINE = "Housing Without the Anxiety";
export const APP_DESCRIPTION =
  "Lagos' trust-first property marketplace. Verified experts, clearer listing intent, and more confident discovery.";

/** Design tokens matching globals.css */
export const COLORS = {
  deepSlateBlue: "#1E3A5F",
  emerald: "#10B981",
  background: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  pending: "#F59E0B",
  rejected: "#EF4444",
  archived: "#9CA3AF",
} as const;

/** Property type labels */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  duplex: "Duplex",
  selfcontain: "Self Contain",
  flat: "Flat",
  bungalow: "Bungalow",
  penthouse: "Penthouse",
};

/** Price range presets (annual rent in Naira) */
export const PRICE_RANGES = [
  { label: "Under ₦500K", min: 0, max: 500_000 },
  { label: "₦500K – ₦1M", min: 500_000, max: 1_000_000 },
  { label: "₦1M – ₦2M", min: 1_000_000, max: 2_000_000 },
  { label: "₦2M – ₦5M", min: 2_000_000, max: 5_000_000 },
  { label: "₦5M – ₦10M", min: 5_000_000, max: 10_000_000 },
  { label: "₦10M – ₦100M", min: 10_000_000, max: 100_000_000 },
  { label: "Above ₦100M", min: 100_000_000, max: Infinity },
] as const;

/** Pagination */
export const DEFAULT_PAGE_SIZE = 24;
