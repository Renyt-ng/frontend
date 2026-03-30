import type { ReferralEvent } from "./referral";

export interface PropertyEngagementStatus {
  wishlist: boolean;
  like: boolean;
}

export interface PropertyEngagementSummary {
  wishlist_count: number;
  like_count: number;
  total_count: number;
}

export interface CreatePropertyMessageIntentInput {
  referral_code?: string | null;
  source_channel?: "whatsapp" | "phone";
}

export interface PropertyMessageIntentResult {
  referral_event: ReferralEvent | null;
}