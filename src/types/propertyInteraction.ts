import type { PropertyListingPurpose, PropertyStatus } from "./property";
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
  status: "sent";
  created_at: string;
}

export interface AgentPropertyInquiry {
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
  status: "sent";
  created_at: string;
  property: {
    id: string;
    title: string;
    area: string;
    status: PropertyStatus;
    listing_purpose: PropertyListingPurpose;
    availability_confirmed_at: string | null;
  } | null;
}