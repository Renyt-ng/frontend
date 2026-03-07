/** Application-wide constants */

export const APP_NAME = "Renyt";
export const APP_TAGLINE = "Rent with Confidence";
export const APP_DESCRIPTION =
  "Lagos' trust-first rental marketplace. Verified agents, transparent pricing, and secure leases.";

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

/** Lagos areas for property search */
export const LAGOS_AREAS = [
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Surulere",
  "Yaba",
  "Ikeja",
  "Ajah",
  "Gbagada",
  "Maryland",
  "Magodo",
  "Oniru",
  "Banana Island",
  "Ogba",
  "Ikate",
  "Chevron",
  "Sangotedo",
] as const;

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
  { label: "Above ₦10M", min: 10_000_000, max: Infinity },
] as const;

/** Pagination */
export const DEFAULT_PAGE_SIZE = 24;
