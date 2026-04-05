import type {
  FeeType,
  ListingAuthorityMode,
  PropertyChecklistItem,
  PropertyCompletion,
  PropertyFeeInput,
  PropertyListingPurpose,
  PropertyReferralBasisSummary,
  PropertyPricingSummary,
} from "@/types";

const MIN_DESCRIPTION_LENGTH = 150;
const MIN_PHOTO_COUNT = 5;
export const AUTHORIZED_LISTING_SHARE_MIN = 0.01;
export const AUTHORIZED_LISTING_SHARE_MAX = 100;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getCommissionBasisLabel(listingPurpose: PropertyListingPurpose) {
  void listingPurpose;
  return "agency fee";
}

export function deriveDraftAgencyFeeAmount(params: {
  listingPurpose?: PropertyListingPurpose;
  rentAmount?: number;
  askingPrice?: number;
  fees?: PropertyFeeInput[];
  feeTypes?: FeeType[];
  fallbackAgencyFee?: number | null;
}) {
  const pricingBaseAmount =
    (params.listingPurpose ?? "rent") === "sale"
      ? Number(params.askingPrice ?? 0)
      : Number(params.rentAmount ?? 0);
  const feeTypesById = new Map((params.feeTypes ?? []).map((feeType) => [feeType.id, feeType]));
  const agencyFeeTotal = (params.fees ?? []).reduce((sum, fee) => {
    const feeType = feeTypesById.get(fee.fee_type_id);
    if (feeType?.slug !== "agency_fee") {
      return sum;
    }

    return sum + calculateDraftFeeAmount(pricingBaseAmount, fee);
  }, 0);

  if (agencyFeeTotal > 0) {
    return Number(agencyFeeTotal.toFixed(2));
  }

  const fallback = Number(params.fallbackAgencyFee ?? 0);
  return fallback > 0 ? fallback : null;
}

export function isValidDeclaredCommissionShare(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return false;
  }

  return value >= AUTHORIZED_LISTING_SHARE_MIN && value <= AUTHORIZED_LISTING_SHARE_MAX;
}

export function buildDraftReferralBasisSummary(params: {
  listing_purpose?: PropertyListingPurpose;
  rent_amount?: number;
  asking_price?: number;
  fees?: PropertyFeeInput[];
  feeTypes?: FeeType[];
  fallback_agency_fee?: number | null;
  listing_authority_mode?: ListingAuthorityMode | null;
  declared_commission_share_percent?: number | null;
}): PropertyReferralBasisSummary {
  const listingPurpose = params.listing_purpose ?? "rent";
  const publicCommissionBasisAmount = deriveDraftAgencyFeeAmount({
    listingPurpose,
    rentAmount: params.rent_amount,
    askingPrice: params.asking_price,
    fees: params.fees,
    feeTypes: params.feeTypes,
    fallbackAgencyFee: params.fallback_agency_fee,
  });
  const basisSourceLabel = publicCommissionBasisAmount
    ? getCommissionBasisLabel(listingPurpose)
    : null;
  const authorityMode = params.listing_authority_mode ?? null;
  const declaredShare =
    authorityMode === "authorized_listing_agent"
      ? params.declared_commission_share_percent ?? null
      : null;

  if (!authorityMode) {
    return {
      basis_source_label: basisSourceLabel,
      public_commission_basis_amount: publicCommissionBasisAmount,
      declared_agent_share_percent: declaredShare,
      eligible_referral_basis_amount: null,
      referral_eligibility_status: "blocked_missing_authority",
      publish_blocker: "Choose who controls the commission side of this listing.",
      uses_declared_share: false,
    };
  }

  if (
    authorityMode === "authorized_listing_agent" &&
    !isValidDeclaredCommissionShare(declaredShare)
  ) {
    return {
      basis_source_label: basisSourceLabel,
      public_commission_basis_amount: publicCommissionBasisAmount,
      declared_agent_share_percent: declaredShare,
      eligible_referral_basis_amount: null,
      referral_eligibility_status: "blocked_missing_share",
      publish_blocker: "Enter your commission share before publishing this listing.",
      uses_declared_share: true,
    };
  }

  if (!publicCommissionBasisAmount) {
    return {
      basis_source_label: basisSourceLabel,
      public_commission_basis_amount: null,
      declared_agent_share_percent: declaredShare,
      eligible_referral_basis_amount: null,
      referral_eligibility_status: "blocked_missing_basis",
      publish_blocker:
        "Add an agency fee line so Renyt can calculate referral eligibility.",
      uses_declared_share: authorityMode === "authorized_listing_agent",
    };
  }

  return {
    basis_source_label: basisSourceLabel,
    public_commission_basis_amount: publicCommissionBasisAmount,
    declared_agent_share_percent: declaredShare,
    eligible_referral_basis_amount:
      authorityMode === "authorized_listing_agent"
        ? roundCurrency((publicCommissionBasisAmount * Number(declaredShare)) / 100)
        : publicCommissionBasisAmount,
    referral_eligibility_status: "eligible",
    publish_blocker: null,
    uses_declared_share: authorityMode === "authorized_listing_agent",
  };
}

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
  fees?: PropertyFeeInput[];
  feeTypes?: FeeType[];
  fallback_agency_fee?: number | null;
  listing_authority_mode?: ListingAuthorityMode | null;
  declared_commission_share_percent?: number | null;
  imageCount: number;
}): PropertyCompletion {
  const listingPurpose = params.listing_purpose ?? "rent";
  const authoritySummary = buildDraftReferralBasisSummary(params);

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
    {
      key: "listing_authority",
      label: "Choose who controls the commission side of this listing",
      completed: authoritySummary.referral_eligibility_status !== "blocked_missing_authority",
      blocking: true,
    },
    {
      key: "commission_share",
      label: "Enter your commission share before publishing this listing",
      completed: authoritySummary.referral_eligibility_status !== "blocked_missing_share",
      blocking: params.listing_authority_mode === "authorized_listing_agent",
    },
    {
      key: "commission_basis",
      label: "Add an agency fee line so Renyt can calculate referral eligibility",
      completed: authoritySummary.referral_eligibility_status !== "blocked_missing_basis",
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