export type ReferralCommissionType = "fixed" | "percentage";

export type ReferralCommissionBasisSource =
  | "none"
  | "agency_fee"
  | "rent_amount"
  | "asking_price";

export type ReferralEventStatus =
  | "potential"
  | "under_review"
  | "confirmed"
  | "rejected"
  | "paid";

export type ReferralSourceChannel = "whatsapp" | "phone";

export type ReferralShareChannel =
  | "copy_link"
  | "whatsapp"
  | "native_share"
  | "direct";

export interface ReferralProfile {
  id: string;
  user_id: string;
  referral_code: string;
  accepted_terms_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralShare {
  id: string;
  referrer_user_id: string;
  property_id: string;
  referral_code: string;
  channel: ReferralShareChannel;
  share_url: string;
  created_at: string;
}

export interface ReferralEvent {
  id: string;
  referrer_user_id: string;
  referred_user_id: string | null;
  property_id: string;
  referral_code: string;
  campaign_id: string | null;
  source_share_id: string | null;
  inquiry_id: string | null;
  qualification_type: "message_agent";
  source_channel: ReferralSourceChannel;
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_label: string | null;
  commission_basis_amount: number | null;
  estimated_amount: number;
  status: ReferralEventStatus;
  rejection_reason: string | null;
  admin_note: string | null;
  fraud_flags: string[];
  metadata: Record<string, unknown>;
  confirmed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCommissionPreview {
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_label: string | null;
  commission_basis_amount: number | null;
  estimated_amount: number;
}

export interface ReferralProgramSettings {
  id: string;
  is_enabled: boolean;
  default_commission_type: ReferralCommissionType;
  default_commission_value: number;
  default_basis_source: ReferralCommissionBasisSource;
  fallback_commission_amount: number;
  terms_version: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCampaign {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  property_id: string | null;
  listing_purpose: "rent" | "sale" | null;
  area: string | null;
  starts_at: string | null;
  ends_at: string | null;
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_source: ReferralCommissionBasisSource;
  fallback_commission_amount: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralPropertyCommissionPreview {
  program_enabled: boolean;
  preview: ReferralCommissionPreview;
  campaign_name: string | null;
}

export interface ReferralProgramAdminConfig {
  settings: ReferralProgramSettings;
  campaigns: ReferralCampaign[];
}

export interface ReferralDashboardSummary {
  potential_earnings: number;
  under_review_earnings: number;
  confirmed_earnings: number;
  paid_earnings: number;
  rejected_earnings: number;
  share_count: number;
  qualified_referrals: number;
  active_shared_properties: number;
}

export interface ReferralDashboardActivity {
  id: string;
  property_id: string;
  property_title: string;
  property_area: string;
  property_status: string;
  property_is_verified: boolean;
  status: ReferralEventStatus;
  qualification_type: "message_agent";
  source_channel: ReferralSourceChannel;
  amount: number;
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_label: string | null;
  commission_basis_amount: number | null;
  campaign_name: string | null;
  rejection_reason: string | null;
  admin_note: string | null;
  event_date: string;
}

export interface ReferralPropertyPerformance {
  property_id: string;
  property_title: string;
  property_area: string;
  property_status: string;
  property_is_verified: boolean;
  share_count: number;
  qualified_messages: number;
  potential_earnings: number;
  confirmed_earnings: number;
  paid_earnings: number;
  commission_preview: ReferralCommissionPreview;
}

export interface ReferralDashboard {
  profile: ReferralProfile | null;
  summary: ReferralDashboardSummary;
  recent_activity: ReferralDashboardActivity[];
  property_performance: ReferralPropertyPerformance[];
}

export interface ReferralShareLink {
  profile: ReferralProfile;
  share: ReferralShare;
  share_url: string;
  commission_preview: ReferralCommissionPreview;
}

export interface AdminReferralEvent {
  id: string;
  referrer_user_id: string;
  referrer_name: string;
  referred_user_id: string | null;
  referred_name: string | null;
  property_id: string;
  property_title: string;
  property_area: string;
  property_status: string;
  property_is_verified: boolean;
  qualification_type: "message_agent";
  source_channel: ReferralSourceChannel;
  status: ReferralEventStatus;
  amount: number;
  commission_type: ReferralCommissionType;
  commission_value: number;
  commission_basis_label: string | null;
  commission_basis_amount: number | null;
  campaign_name: string | null;
  inquiry_id: string | null;
  referral_code: string;
  rejection_reason: string | null;
  admin_note: string | null;
  fraud_flags: string[];
  created_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
}