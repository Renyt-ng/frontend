const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format number as Nigerian Naira, e.g. "₦1,200,000" */
export function formatCurrency(amount: number): string {
  return NGN.format(amount);
}

/** Format as compact Naira, e.g. "₦1.2M" */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return `₦${amount}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Format ISO date string, e.g. "1 Mar 2026" */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** Relative time, e.g. "2 days ago" */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(iso);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format property type for display (e.g. "selfcontain" → "Self Contain") */
export function formatPropertyType(type: string): string {
  const LABELS: Record<string, string> = {
    apartment: "Apartment",
    duplex: "Duplex",
    shortlet: "Shortlet",
    selfcontain: "Self Contain",
    flat: "Flat",
    bungalow: "Bungalow",
    penthouse: "Penthouse",
  };

  if (LABELS[type]) {
    return LABELS[type];
  }

  return type
    .split(/[_-]+/)
    .map((part) => capitalize(part))
    .join(" ");
}

export function formatListingPurpose(purpose: "rent" | "sale"): string {
  return purpose === "sale" ? "For Sale" : "For Rent";
}

export function formatPropertyPriceLabel(params: {
  listingPurpose: "rent" | "sale";
  rentAmount?: number | null;
  askingPrice?: number | null;
  isPriceNegotiable?: boolean | null;
}) {
  if (params.listingPurpose === "sale") {
    return {
      amount: formatCurrency(params.askingPrice ?? 0),
      qualifier: params.isPriceNegotiable ? "asking" : null,
    };
  }

  return {
    amount: formatCurrency(params.rentAmount ?? 0),
    qualifier: "per year",
  };
}

/** Slugify text for URLs */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
