"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/layout";
import { SearchBar, FilterBar, IntentToggle } from "@/components/search";
import { PropertyGrid } from "@/components/property";
import { Button, Select } from "@/components/ui";
import { appendPropertyTypeParams } from "@/lib/utils";
import { useSearchStore } from "@/stores/searchStore";
import { propertiesApi } from "@/lib/api";
import type { Property, PropertyImage, PropertyListingPurpose, PropertyType } from "@/types";

interface SearchPageClientProps {
  initialArea: string;
  initialLocationSlug: string;
  initialFreshOnly: boolean;
  initialVerifiedOnly: boolean;
  initialListingPurpose: PropertyListingPurpose;
  initialPropertyTypes: PropertyType[];
}

export function SearchPageClient({
  initialArea,
  initialLocationSlug,
  initialFreshOnly,
  initialVerifiedOnly,
  initialListingPurpose,
  initialPropertyTypes,
}: SearchPageClientProps) {
  const router = useRouter();

  const {
    area,
    locationSlug,
    listingPurpose,
    propertyTypes,
    minPrice,
    maxPrice,
    freshOnly,
    verifiedOnly,
    bedrooms,
    sortBy,
    sortOrder,
    page,
    setArea,
    setLocation,
    setListingPurpose,
    setPropertyTypes,
    setFreshOnly,
    setVerifiedOnly,
    setSort,
    setPage,
  } = useSearchStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, PropertyImage[]>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [hasHydratedInitialFilters, setHasHydratedInitialFilters] = useState(false);
  const latestRequestIdRef = useRef(0);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const sortOptions = [
    { value: "created_at:desc", label: "Newest First" },
    { value: "created_at:asc", label: "Oldest First" },
    { value: "rent_amount:asc", label: "Price: Low → High" },
    { value: "rent_amount:desc", label: "Price: High → Low" },
  ];

  // Sync URL params → store on mount
  useEffect(() => {
    if (initialLocationSlug) {
      setLocation(initialArea, initialLocationSlug);
    } else if (initialArea) {
      setArea(initialArea);
    }
    setFreshOnly(initialFreshOnly);
    setVerifiedOnly(initialVerifiedOnly);
    setListingPurpose(initialListingPurpose);
    setPropertyTypes(initialPropertyTypes);
    setHasHydratedInitialFilters(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch properties when filters change
  const fetchProperties = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    activeRequestControllerRef.current?.abort();
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    setIsLoading(true);

    try {
      const res = await propertiesApi.searchProperties({
        area: area || undefined,
        location_slug: locationSlug || undefined,
        listing_purpose: listingPurpose,
        property_type: propertyTypes.length > 0 ? propertyTypes : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        fresh: freshOnly || undefined,
        verified: verifiedOnly || undefined,
        bedrooms,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 24,
      }, controller.signal);

      if (requestId !== latestRequestIdRef.current || controller.signal.aborted) {
        return;
      }

      const list = res.data ?? [];
      setProperties(list);
      setTotal(res.pagination?.total ?? list.length);

      // Build image map from joined property images
      const map: Record<string, PropertyImage[]> = {};
      for (const p of list as any[]) {
        if (p.images) map[p.id] = p.images;
        else if (p.property_images) map[p.id] = p.property_images;
      }
      setImageMap(map);
    } catch {
      if (requestId !== latestRequestIdRef.current || controller.signal.aborted) {
        return;
      }

      setProperties([]);
      setTotal(0);
    } finally {
      if (
        requestId === latestRequestIdRef.current &&
        activeRequestControllerRef.current === controller
      ) {
        activeRequestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [
    area,
    locationSlug,
    listingPurpose,
    propertyTypes,
    minPrice,
    maxPrice,
    freshOnly,
    verifiedOnly,
    bedrooms,
    sortBy,
    sortOrder,
    page,
  ]);

  useEffect(() => {
    if (!hasHydratedInitialFilters) {
      return;
    }

    fetchProperties();
  }, [fetchProperties, hasHydratedInitialFilters]);

  useEffect(() => {
    return () => {
      activeRequestControllerRef.current?.abort();
    };
  }, []);

  const handleLocationSearch = useCallback(
    ({ area: nextArea, locationSlug: nextLocationSlug }: { area: string; locationSlug?: string }) => {
      if (nextLocationSlug) {
        setLocation(nextArea, nextLocationSlug);
        return;
      }

      setArea(nextArea);
    },
    [setArea, setLocation],
  );

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (locationSlug) params.set("location_slug", locationSlug);
    if (listingPurpose !== "rent") params.set("listing_purpose", listingPurpose);
    appendPropertyTypeParams(params, propertyTypes);
    if (minPrice) params.set("min_price", String(minPrice));
    if (maxPrice && maxPrice < Infinity)
      params.set("max_price", String(maxPrice));
    if (freshOnly) params.set("fresh", "true");
    if (verifiedOnly) params.set("verified", "true");
    if (bedrooms) params.set("bedrooms", String(bedrooms));
    if (sortBy !== "created_at") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);

    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, locationSlug, listingPurpose, propertyTypes, minPrice, maxPrice, freshOnly, verifiedOnly, bedrooms, sortBy, sortOrder]);

  return (
    <div className="pb-16">
      {/* Search Header */}
      <div className="border-b border-[var(--color-border)] bg-white py-6">
        <Container>
          <div className="mx-auto max-w-2xl">
            <SearchBar
              defaultArea={area}
              defaultLocationSlug={locationSlug}
              navigateOnSearch={false}
              onSearch={handleLocationSearch}
            />
          </div>
          <div className="mt-4 flex justify-center sm:justify-start">
            <IntentToggle />
          </div>
        </Container>
      </div>

      <Container className="mt-6">
        {/* Toolbar */}
        <div className="relative z-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Desktop filters */}
          <div className="hidden sm:block">
            <FilterBar />
          </div>

          {/* Mobile filter toggle */}
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          {/* Sort + Result count */}
          <div className="flex flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <span className="text-sm text-[var(--color-text-secondary)] sm:text-right">
              {isLoading
                ? "Searching..."
                : `${total} ${total === 1 ? "property" : "properties"}`}
              {area ? ` in ${area}` : ""}
            </span>
            <Select
              options={sortOptions}
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":") as [
                  "rent_amount" | "created_at",
                  "asc" | "desc",
                ];
                setSort(by, order);
              }}
              className="h-9 w-full min-w-0 rounded-lg bg-white py-0 text-sm sm:min-w-[170px]"
            />
          </div>
        </div>

        {/* Mobile filters (collapsible) */}
        {showMobileFilters && (
          <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-4 sm:hidden">
            <FilterBar />
          </div>
        )}

        {/* Results Grid */}
        <PropertyGrid
          properties={properties}
          imageMap={imageMap}
          isLoading={isLoading}
          emptyMessage={
            area
              ? `No ${listingPurpose === "sale" ? "homes for sale" : "rental listings"} found in ${area}`
              : `No ${listingPurpose === "sale" ? "homes for sale" : "properties"} match your filters`
          }
        />
      </Container>
    </div>
  );
}
