"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Container } from "@/components/layout";
import { SearchBar, FilterBar, AreaTags } from "@/components/search";
import { PropertyGrid } from "@/components/property";
import { Button, Select } from "@/components/ui";
import { useSearchStore } from "@/stores/searchStore";
import { propertiesApi } from "@/lib/api";
import type { Property, PropertyImage } from "@/types";

interface SearchPageClientProps {
  initialArea: string;
  initialPropertyType: string;
}

export function SearchPageClient({
  initialArea,
  initialPropertyType,
}: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    area,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    sortBy,
    sortOrder,
    page,
    setArea,
    setPropertyType,
    setSort,
    setPage,
  } = useSearchStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, PropertyImage[]>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync URL params → store on mount
  useEffect(() => {
    if (initialArea) setArea(initialArea);
    if (initialPropertyType) setPropertyType(initialPropertyType as "" | any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch properties when filters change
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await propertiesApi.searchProperties({
        area: area || undefined,
        property_type: (propertyType as any) || undefined,
        min_price: minPrice,
        max_price: maxPrice,
        bedrooms,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 24,
      });

      const list = res.data ?? [];
      setProperties(list);
      setTotal(list.length);

      // Build image map from joined property images
      const map: Record<string, PropertyImage[]> = {};
      for (const p of list as any[]) {
        if (p.images) map[p.id] = p.images;
        else if (p.property_images) map[p.id] = p.property_images;
      }
      setImageMap(map);
    } catch {
      setProperties([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    area,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    sortBy,
    sortOrder,
    page,
  ]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (propertyType) params.set("property_type", propertyType);
    if (minPrice) params.set("min_price", String(minPrice));
    if (maxPrice && maxPrice < Infinity)
      params.set("max_price", String(maxPrice));
    if (bedrooms) params.set("bedrooms", String(bedrooms));
    if (sortBy !== "created_at") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);

    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, propertyType, minPrice, maxPrice, bedrooms, sortBy, sortOrder]);

  return (
    <div className="pb-16">
      {/* Search Header */}
      <div className="border-b border-[var(--color-border)] bg-white py-6">
        <Container>
          <div className="mx-auto max-w-2xl">
            <SearchBar defaultArea={area} />
          </div>
        </Container>
      </div>

      <Container className="mt-6">
        {/* Area Tags */}
        <AreaTags currentArea={area} className="mb-6" />

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Desktop filters */}
          <div className="hidden sm:block">
            <FilterBar />
          </div>

          {/* Mobile filter toggle */}
          <Button
            variant="secondary"
            size="sm"
            className="sm:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          {/* Sort + Result count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {isLoading
                ? "Searching..."
                : `${total} ${total === 1 ? "property" : "properties"}`}
              {area ? ` in ${area}` : ""}
            </span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":") as [
                  "rent_amount" | "created_at",
                  "asc" | "desc",
                ];
                setSort(by, order);
              }}
              className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="rent_amount:asc">Price: Low → High</option>
              <option value="rent_amount:desc">Price: High → Low</option>
            </select>
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
              ? `No properties found in ${area}`
              : "No properties match your filters"
          }
        />
      </Container>
    </div>
  );
}
