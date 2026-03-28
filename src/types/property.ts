export type PropertyType = string;

export interface PropertyTypeDefinition {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyStatus = "draft" | "active" | "archived" | "rented";
export type PropertyApplicationMode = "instant_apply" | "message_agent";
export type PropertyListingPurpose = "rent" | "sale";
export type FeeValueType = "fixed" | "percentage";

export type PropertyVerificationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

export interface FeeType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  supports_fixed: boolean;
  supports_percentage: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PropertyFee {
  id: string;
  property_id: string;
  fee_type_id: string;
  label: string;
  value_type: FeeValueType;
  amount: number | null;
  percentage: number | null;
  calculated_amount: number;
  display_order: number;
  created_at: string;
  fee_type?: FeeType | null;
}

export interface PropertyPricingSummary {
  annual_rent: number;
  monthly_equivalent: number;
  asking_price: number;
  fees_total: number;
  total_move_in_cost: number;
}

export interface PropertyChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  blocking: boolean;
}

export interface PropertyCompletion {
  ready_to_publish: boolean;
  completed_count: number;
  total_count: number;
  progress_percentage: number;
  blockers: string[];
  checklist: PropertyChecklistItem[];
}

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  area: string;
  address_line: string;
  property_type: PropertyType;
  listing_purpose: PropertyListingPurpose;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number | null;
  asking_price: number | null;
  service_charge: number | null;
  caution_deposit: number | null;
  agency_fee: number | null;
  application_mode: PropertyApplicationMode;
  is_verified: boolean;
  verification_status: PropertyVerificationStatus;
  status: PropertyStatus;
  last_updated_at: string;
  created_at: string;
  images?: PropertyImage[];
  property_fees?: PropertyFee[];
  property_videos?: PropertyVideo[];
  pricing_summary?: PropertyPricingSummary;
  completion?: PropertyCompletion;
}

export interface PropertyFeeInput {
  fee_type_id: string;
  label?: string;
  value_type: FeeValueType;
  amount?: number | null;
  percentage?: number | null;
  display_order?: number;
}

export interface CreatePropertyInput {
  agent_id?: string;
  title: string;
  description: string;
  area: string;
  address_line: string;
  property_type: PropertyType;
  listing_purpose: PropertyListingPurpose;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number | null;
  asking_price: number | null;
  service_charge: number | null;
  caution_deposit: number | null;
  agency_fee: number | null;
  application_mode: PropertyApplicationMode;
  fees?: PropertyFeeInput[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  display_order: number;
  is_cover?: boolean;
  created_at: string;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  video_url: string;
  storage_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  created_at: string;
}

export interface PropertyAgentContact {
  business_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
}

/** Property with joined images for display */
export interface PropertyWithImages extends Property {
  images: PropertyImage[];
  property_images?: PropertyImage[];
  property_videos?: PropertyVideo[];
  agent_contact?: PropertyAgentContact;
}

/** Search/filter params sent to the API */
export interface PropertySearchParams {
  area?: string;
  location_slug?: string;
  property_type?: PropertyType[];
  listing_purpose?: PropertyListingPurpose;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: PropertyStatus;
  page?: number;
  limit?: number;
  sort_by?: "rent_amount" | "created_at";
  sort_order?: "asc" | "desc";
}

export interface UploadPropertyMediaInput {
  file_name: string;
  content_type: string;
  base64_data: string;
}
