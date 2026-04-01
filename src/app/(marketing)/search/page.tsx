import type { Metadata } from "next";
import { normalizePropertyTypes } from "@/lib/utils";
import { SearchPageClient } from "./SearchPageClient";

export const metadata: Metadata = {
  title: "Search Properties",
  description:
    "Search verified rental properties across Lagos. Filter by area, property type, price range, and bedrooms.",
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <SearchPageClient
      initialArea={typeof params.area === "string" ? params.area : ""}
      initialLocationSlug={
        typeof params.location_slug === "string" ? params.location_slug : ""
      }
      initialFreshOnly={params.fresh === "true"}
      initialVerifiedOnly={params.verified === "true"}
      initialListingPurpose={
        typeof params.listing_purpose === "string" && params.listing_purpose === "sale"
          ? "sale"
          : "rent"
      }
      initialPropertyTypes={normalizePropertyTypes(params.property_type)}
    />
  );
}
