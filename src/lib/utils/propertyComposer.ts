import type {
  PropertyChecklistItem,
  PropertyCompletion,
  PropertyFeeInput,
  PropertyListingPurpose,
  PropertyPricingSummary,
} from "@/types";

const MIN_DESCRIPTION_LENGTH = 150;
const MIN_PHOTO_COUNT = 5;

export function calculateDraftFeeAmount(
  pricingBaseAmount: number,
  fee: PropertyFeeInput,
) {
  if (fee.value_type === "percentage") {
    return Number((((fee.percentage ?? 0) * pricingBaseAmount) / 100).toFixed(2));
  }

  return Number((fee.amount ?? 0).toFixed(2));
}

export function buildDraftPricingSummary(
  listingPurpose: PropertyListingPurpose,
  rentAmount: number,
  askingPrice: number,
  fees: PropertyFeeInput[],
): PropertyPricingSummary {
  const pricingBaseAmount = listingPurpose === "sale" ? askingPrice : rentAmount;

  const feesTotal = fees.reduce(
    (sum, fee) => sum + calculateDraftFeeAmount(pricingBaseAmount, fee),
    0,
  );

  return {
    annual_rent: rentAmount,
    monthly_equivalent:
      listingPurpose === "sale" ? 0 : Number((rentAmount / 12).toFixed(2)),
    asking_price: askingPrice,
    fees_total: Number(feesTotal.toFixed(2)),
    total_move_in_cost: Number((pricingBaseAmount + feesTotal).toFixed(2)),
  };
}

export function buildDraftChecklist(params: {
  title: string;
  description: string;
  area: string;
  address_line: string;
  property_type: string;
  listing_purpose?: PropertyListingPurpose;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  asking_price?: number;
  imageCount: number;
}): PropertyCompletion {
  const listingPurpose = params.listing_purpose ?? "rent";

  const checklist: PropertyChecklistItem[] = [
    {
      key: "title",
      label: "Add a listing title",
      completed: params.title.trim().length > 0,
      blocking: true,
    },
    {
      key: "description",
      label: `Write at least ${MIN_DESCRIPTION_LENGTH} characters of description`,
      completed: params.description.trim().length >= MIN_DESCRIPTION_LENGTH,
      blocking: true,
    },
    {
      key: "area",
      label: "Select an area",
      completed: params.area.trim().length > 0,
      blocking: true,
    },
    {
      key: "address_line",
      label: "Add the street address",
      completed: params.address_line.trim().length > 0,
      blocking: true,
    },
    {
      key: "property_type",
      label: "Choose a property type",
      completed: params.property_type.trim().length > 0,
      blocking: true,
    },
    {
      key: "rooms",
      label: "Set bedrooms and bathrooms",
      completed: params.bedrooms >= 0 && params.bathrooms >= 0,
      blocking: true,
    },
    {
      key: "pricing",
      label:
        listingPurpose === "sale"
          ? "Add asking price"
          : "Add annual rent",
      completed:
        listingPurpose === "sale"
          ? (params.asking_price ?? 0) > 0
          : params.rent_amount > 0,
      blocking: true,
    },
    {
      key: "photos",
      label: `Upload at least ${MIN_PHOTO_COUNT} photos`,
      completed: params.imageCount >= MIN_PHOTO_COUNT,
      blocking: true,
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const blockers = checklist
    .filter((item) => item.blocking && !item.completed)
    .map((item) => item.label);

  return {
    ready_to_publish: blockers.length === 0,
    completed_count: completedCount,
    total_count: checklist.length,
    progress_percentage: Math.round((completedCount / checklist.length) * 100),
    blockers,
    checklist,
  };
}