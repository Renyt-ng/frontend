import type { ReferralEvent } from "./referral";

export interface PropertyEngagementStatus {
  wishlist: boolean;
  like: boolean;
}

export interface CreatePropertyInquiryInput {
  full_name: string;
  phone: string;
  email: string;
  note?: string | null;
  referral_code?: string | null;
  source_channel?: "whatsapp" | "phone";
}

export interface CreatePropertyMessageIntentInput {
  referral_code?: string | null;
  source_channel?: "whatsapp" | "phone";
}

export interface PropertyMessageIntentResult {
  referral_event: ReferralEvent | null;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  user_id: string;
  agent_id: string;
  referrer_user_id?: string | null;
  referral_code?: string | null;
  full_name: string;
  phone: string;
  email: string;
  note: string | null;
  created_at: string;
}