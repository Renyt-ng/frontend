export type LocationKind = "area" | "lga";

export interface Location {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  kind: LocationKind;
  parent_name: string | null;
  city: string;
  state: string;
  country: string;
  aliases: string[];
  is_active: boolean;
  sort_order: number;
  popularity_rank: number;
  created_at: string;
  updated_at: string;
}

export interface LocationSearchParams {
  q?: string;
  kind?: LocationKind | "all";
  limit?: number;
}