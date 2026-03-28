"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Eye, Edit3, PencilLine } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { PropertyCardSkeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { propertiesApi } from "@/lib/api";
import { formatPropertyPriceLabel, formatPropertyType, formatListingPurpose } from "@/lib/utils";
import type { Property } from "@/types";

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await propertiesApi.getMyProperties();
        setProperties(res.data ?? []);
      } catch {
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            My Properties
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage your property listings
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Plus className="h-8 w-8 text-[var(--color-deep-slate-blue)]" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              No properties yet
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              List your first property to start receiving applications.
            </p>
            <Link href="/dashboard/properties/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="hidden h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0].image_url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-[var(--color-text-primary)]">
                      {p.title}
                    </h3>
                    <StatusBadge status={p.status} />
                    {p.completion && p.status === "draft" && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[var(--color-deep-slate-blue)]">
                        {p.completion.progress_percentage}% complete
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    {formatListingPurpose(p.listing_purpose)} &middot; {formatPropertyType(p.property_type)}{" "}
                    &middot; {p.area} &middot; {p.bedrooms} bed, {p.bathrooms}{" "}
                    bath
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-deep-slate-blue)]">
                    {
                      formatPropertyPriceLabel({
                        listingPurpose: p.listing_purpose,
                        rentAmount: p.rent_amount,
                        askingPrice: p.asking_price,
                      }).amount
                    }
                  </p>
                  {p.completion && p.status === "draft" && p.completion.blockers.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                      Blocking publish: {p.completion.blockers.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={p.status === "active" ? `/properties/${p.id}` : `/dashboard/properties/${p.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      {p.status === "active" ? <Eye className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/properties/${p.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
