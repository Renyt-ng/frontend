import type { Metadata } from "next";
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
      initialPropertyType={
        typeof params.property_type === "string" ? params.property_type : ""
      }
    />
  );
}
