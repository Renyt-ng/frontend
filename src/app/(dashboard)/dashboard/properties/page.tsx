"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  Ban,
  Check,
  CircleAlert,
  Edit3,
  Eye,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { PropertyCardSkeleton } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import {
  useConfirmPropertyAvailability,
  useMyProperties,
  useUpdateProperty,
} from "@/lib/hooks";
import {
  formatPropertyPriceLabel,
  formatPropertyType,
  formatListingPurpose,
  getListingHealthGroup,
  getOutcomeActions,
  getPropertyFinalOutcomeLabel,
  getPropertyFreshnessLabel,
  getPropertyFreshnessMeta,
  summarizeListingHealth,
} from "@/lib/utils";
import type { Property } from "@/types";

export default function MyPropertiesPage() {
  const searchParams = useSearchParams();
  const trackedPublishId = searchParams.get("publishing");
  const propertiesQuery = useMyProperties({
    refetchInterval: (query) => {
      const properties = query.state.data?.data ?? [];
      return properties.some((property) => property.status === "publishing") ? 2000 : false;
    },
  });
  const confirmAvailability = useConfirmPropertyAvailability();
  const updateProperty = useUpdateProperty();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const properties = propertiesQuery.data?.data ?? [];
  const summary = useMemo(() => summarizeListingHealth(properties), [properties]);
  const groupedProperties = useMemo(() => {
    const groups = {
      publishing: [] as Property[],
      needs_confirmation: [] as Property[],
      active: [] as Property[],
      final_outcomes: [] as Property[],
      unavailable: [] as Property[],
      archived: [] as Property[],
      draft: [] as Property[],
    };

    properties.forEach((property) => {
      groups[getListingHealthGroup(property)].push(property);
    });

    return groups;
  }, [properties]);
  const trackedPublishProperty = useMemo(
    () => properties.find((property) => property.id === trackedPublishId) ?? null,
    [properties, trackedPublishId],
  );

  const groupMeta: Array<{
    key: keyof typeof groupedProperties;
    title: string;
    description: string;
  }> = [
    {
      key: "publishing",
      title: "Publishing",
      description: "Listings accepted for publish and still being prepared to go live.",
    },
    {
      key: "needs_confirmation",
      title: "Needs confirmation",
      description: "Listings that should be reconfirmed before trust drops.",
    },
    {
      key: "active",
      title: "Active",
      description: "Fresh, visible listings still healthy in discovery.",
    },
    {
      key: "final_outcomes",
      title: "Final outcomes",
      description: "Completed listings split by Renyt-close and off-platform close.",
    },
    {
      key: "unavailable",
      title: "Unavailable",
      description: "Listings temporarily removed from inquiry flow.",
    },
    {
      key: "archived",
      title: "Archived",
      description: "Listings kept for history, not active demand.",
    },
    {
      key: "draft",
      title: "Drafts",
      description: "Listings still blocked from publish or activation.",
    },
  ];

  async function handleConfirmAvailability(propertyId: string) {
    setActiveAction(`confirm:${propertyId}`);
    try {
      await confirmAvailability.mutateAsync(propertyId);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleStatusUpdate(propertyId: string, status: Property["status"]) {
    setActiveAction(`${status}:${propertyId}`);
    try {
      await updateProperty.mutateAsync({ id: propertyId, data: { status } });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Listing Health
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Confirm availability, record final outcomes, and keep Renyt closes separate from off-platform ones.
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Publishing</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">
              {summary.publishing}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Active</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Needs confirmation</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{summary.needs_confirmation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Final outcomes</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{summary.final_outcomes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Drafts</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{summary.draft}</p>
          </CardContent>
        </Card>
      </div>

      {trackedPublishId ? (
        <Card className="border-0 shadow-sm ring-1 ring-black/5" aria-live="polite">
          <CardContent className="space-y-4 p-6">
            {trackedPublishProperty?.status === "active" ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Check className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Your property is now live
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Publishing completed. The listing is now active in My Properties.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/properties/new">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create Another Property
                    </Button>
                  </Link>
                  <Link href={`/properties/${trackedPublishProperty.id}`}>
                    <Button variant="secondary">
                      <Eye className="h-4 w-4" />
                      View Listing
                    </Button>
                  </Link>
                </div>
              </div>
            ) : trackedPublishProperty?.status === "draft" && trackedPublishProperty.publish_error ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-[var(--color-rejected)]">
                    <CircleAlert className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Publishing did not complete
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {trackedPublishProperty.publish_error}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/dashboard/properties/${trackedPublishProperty.id}/edit`}>
                    <Button>
                      <RefreshCw className="h-4 w-4" />
                      Retry Publish
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </span>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Publishing started
                      </h2>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        We&apos;re preparing this property to go live. This usually takes a few seconds, and you can keep working while we finish.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <StatusBadge status="publishing" size="sm" />
                    <span>Your property is not live yet.</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/properties/new">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create Another Property
                    </Button>
                  </Link>
                  {trackedPublishProperty ? (
                    <Link href={`/dashboard/properties/${trackedPublishProperty.id}/edit`}>
                      <Button variant="secondary">
                        <Edit3 className="h-4 w-4" />
                        Review Listing
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {propertiesQuery.isLoading ? (
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
              List your first property to start receiving inquiries.
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
        <div className="space-y-6">
          {groupMeta.map((group) => {
            const items = groupedProperties[group.key];
            if (items.length === 0) {
              return null;
            }

            return (
              <div key={group.key} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {group.description}
                  </p>
                </div>

                {items.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
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
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {getPropertyFreshnessLabel(p)}
                    {getPropertyFreshnessMeta(p)
                      ? ` · ${getPropertyFreshnessMeta(p)}`
                      : ""}
                  </p>
                  {getPropertyFinalOutcomeLabel(p.status) ? (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {getPropertyFinalOutcomeLabel(p.status)}
                    </p>
                  ) : null}
                  {p.status === "publishing" ? (
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      We&apos;re preparing this listing for search. You can publish another property while this completes.
                    </p>
                  ) : null}
                  {p.completion && p.status === "draft" && p.completion.blockers.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                      Blocking publish: {p.completion.blockers.join(", ")}
                    </p>
                  )}
                  {p.status === "draft" && p.publish_error ? (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--color-rejected)]">
                      Last publish attempt failed: {p.publish_error}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 lg:w-[420px] lg:items-end">
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {p.status !== "draft" && p.status !== "publishing" && p.status !== "archived" && !getPropertyFinalOutcomeLabel(p.status) ? (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAvailability(p.id)}
                        isLoading={activeAction === `confirm:${p.id}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Confirm available
                      </Button>
                    ) : null}
                    {p.status !== "draft" && p.status !== "publishing" && !getPropertyFinalOutcomeLabel(p.status) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusUpdate(p.id, "unavailable")}
                        isLoading={activeAction === `unavailable:${p.id}`}
                      >
                        <Ban className="h-4 w-4" />
                        Mark unavailable
                      </Button>
                    ) : null}
                    {p.status !== "draft" && p.status !== "publishing" && !getPropertyFinalOutcomeLabel(p.status) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusUpdate(p.id, "archived")}
                        isLoading={activeAction === `archived:${p.id}`}
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </Button>
                    ) : null}
                    {p.status !== "publishing" && !getPropertyFinalOutcomeLabel(p.status)
                      ? getOutcomeActions(p.listing_purpose).map((action) => (
                          <Button
                            key={action.status}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(p.id, action.status)}
                            isLoading={activeAction === `${action.status}:${p.id}`}
                          >
                            {action.label}
                          </Button>
                        ))
                      : null}
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
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
                </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
