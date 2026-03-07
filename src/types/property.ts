export type PropertyType =
  | "apartment"
  | "duplex"
  | "selfcontain"
  | "flat"
  | "bungalow"
  | "penthouse";

export type PropertyStatus = "active" | "archived" | "rented";

export type PropertyVerificationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  area: string;
  address_line: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  service_charge: number | null;
  caution_deposit: number | null;
  agency_fee: number | null;
  is_verified: boolean;
  verification_status: PropertyVerificationStatus;
  status: PropertyStatus;
  last_updated_at: string;
  created_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

/** Property with joined images for display */
export interface PropertyWithImages extends Property {
  images: PropertyImage[];
}

/** Search/filter params sent to the API */
export interface PropertySearchParams {
  area?: string;
  property_type?: PropertyType;
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
