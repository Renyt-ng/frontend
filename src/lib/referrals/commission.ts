import type {
  Property,
  ReferralCommissionPreview,
} from "@/types";

export const DEFAULT_FIXED_REFERRAL_COMMISSION = 20_000;
export const DEFAULT_PERCENTAGE_REFERRAL_RATE = 5;

export function getReferralCommissionPreview(
  property: Pick<
    Property,
    "listing_purpose" | "agency_fee" | "rent_amount" | "asking_price"
  >,
): ReferralCommissionPreview {
  const agencyFee = Number(property.agency_fee ?? 0);

  if (property.listing_purpose === "rent" && agencyFee > 0) {
    return {
      commission_type: "percentage",
      commission_value: DEFAULT_PERCENTAGE_REFERRAL_RATE,
      commission_basis_label: "agency fee",
      commission_basis_amount: agencyFee,
      estimated_amount:
        Math.round(((agencyFee * DEFAULT_PERCENTAGE_REFERRAL_RATE) / 100) * 100) /
        100,
    };
  }

  return {
    commission_type: "fixed",
    commission_value: DEFAULT_FIXED_REFERRAL_COMMISSION,
    commission_basis_label: null,
    commission_basis_amount: null,
    estimated_amount: DEFAULT_FIXED_REFERRAL_COMMISSION,
  };
}