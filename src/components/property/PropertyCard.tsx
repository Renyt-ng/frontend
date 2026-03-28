"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BedDouble, Bath, MapPin, ShieldCheck, Camera, Heart } from "lucide-react";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Avatar } from "@/components/ui";
import {
  cn,
  formatListingPurpose,
  formatPropertyPriceLabel,
  formatPropertyType,
  formatRelativeTime,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  usePropertyEngagementStatus,
  useTogglePropertyEngagement,
} from "@/lib/hooks/usePropertyInteractions";
import type { Property, PropertyAgentContact, PropertyImage } from "@/types";
import { PropertyEngagementButtons } from "./PropertyEngagementButtons";

type PropertyCardData = Property & {
  agent_contact?: PropertyAgentContact;
};

interface PropertyCardProps {
  property: PropertyCardData;
  images?: PropertyImage[];
  className?: string;
}

export function PropertyCard({
  property,
  images,
  className,
}: PropertyCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const statusQuery = usePropertyEngagementStatus(property.id, isAuthenticated);
  const toggleEngagement = useTogglePropertyEngagement();
  const touchTimeoutRef = useRef<number | null>(null);
  const lastTouchRef = useRef(0);
  const ignoreClickRef = useRef(false);
  const burstTimeoutRef = useRef<number | null>(null);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const primaryImage = images?.[0]?.image_url;
  const imageCount = images?.length ?? 0;
  const agentName = property.agent_contact?.full_name?.trim() || "Verified Agent";
  const detailHref = `/properties/${property.id}`;

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        window.clearTimeout(touchTimeoutRef.current);
      }

      if (burstTimeoutRef.current) {
        window.clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  function triggerLikeBurst() {
    setShowLikeBurst(true);

    if (burstTimeoutRef.current) {
      window.clearTimeout(burstTimeoutRef.current);
    }

    burstTimeoutRef.current = window.setTimeout(() => {
      setShowLikeBurst(false);
    }, 700);
  }

  async function toggleLikeFromGesture() {
    const engagement = statusQuery.data?.data ?? { wishlist: false, like: false };
    const nextLikeState = !engagement.like;

    if (nextLikeState) {
      triggerLikeBurst();
    }

    await toggleEngagement.mutateAsync({
      propertyId: property.id,
      engagementType: "like",
      active: engagement.like,
    });
  }

  function navigateToDetail() {
    router.push(detailHref);
  }

  function handleImageTouch() {
    ignoreClickRef.current = true;

    if (!isAuthenticated) {
      navigateToDetail();
      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 250);
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTouchRef.current < 240;

    if (isDoubleTap) {
      if (touchTimeoutRef.current) {
        window.clearTimeout(touchTimeoutRef.current);
      }

      lastTouchRef.current = 0;
      ignoreClickRef.current = false;
      void toggleLikeFromGesture();
      return;
    }

    lastTouchRef.current = now;
    touchTimeoutRef.current = window.setTimeout(() => {
      navigateToDetail();
      ignoreClickRef.current = false;
    }, 220);
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all group-hover:-translate-y-0.5",
        className,
      )}
    >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <button
            type="button"
            aria-label={`View details for ${property.title}`}
            className="absolute inset-0 z-10"
            onTouchEnd={(event) => {
              event.preventDefault();
              handleImageTouch();
            }}
            onClick={(event) => {
              event.preventDefault();

              if (ignoreClickRef.current) {
                return;
              }

              navigateToDetail();
            }}
          />

          {primaryImage ? (
            <img
              src={primaryImage}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--color-text-secondary)]">
              <Camera className="h-10 w-10 opacity-30" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full bg-black/20 opacity-0 transition-all duration-500",
                showLikeBurst ? "scale-100 opacity-100" : "scale-50 opacity-0",
              )}
            >
              <Heart
                className={cn(
                  "h-10 w-10 text-white transition-all duration-500",
                  showLikeBurst ? "scale-100 fill-current" : "scale-75",
                )}
              />
            </div>
          </div>

          {/* Image count overlay */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
              <Camera className="h-3 w-3" />
              {imageCount}
            </div>
          )}

          {/* Status / Availability badges */}
          <div className="absolute left-2 top-2 z-20 flex flex-wrap gap-1">
            <span className="rounded-md bg-[var(--color-deep-slate-blue)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              {formatListingPurpose(property.listing_purpose)}
            </span>
            {property.status === "active" && (
              <span className="rounded-md bg-[var(--color-emerald)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Available
              </span>
            )}
            {property.listing_purpose === "rent" && property.application_mode === "instant_apply" && (
              <span className="rounded-md bg-[var(--color-deep-slate-blue)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Instant Apply
              </span>
            )}
            {property.is_verified && (
              <span className="flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-emerald)] backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          {/* Property type pill */}
          <div className="absolute bottom-2 left-2 z-20">
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)] backdrop-blur-sm">
              {formatPropertyType(property.property_type)}
            </span>
          </div>

          <div className="absolute right-2 top-2 z-30">
            <PropertyEngagementButtons
              propertyId={property.id}
              compact
              onLikeCommitted={(active) => {
                if (active) {
                  triggerLikeBurst();
                }
              }}
            />
          </div>
        </div>

        <Link href={detailHref} className="block p-4">
          {/* Title */}
          <h3 className="line-clamp-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-deep-slate-blue)]">
            {property.title}
          </h3>

          {/* Location */}
          <div className="mt-1 flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{property.area}</span>
          </div>

          {/* Specs row */}
          <div className="mt-3 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              <span>
                {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>
                {property.bathrooms}{" "}
                {property.bathrooms === 1 ? "Bath" : "Baths"}
              </span>
            </div>
          </div>

          {/* Price + timestamp */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              {(() => {
                const price = formatPropertyPriceLabel({
                  listingPurpose: property.listing_purpose,
                  rentAmount: property.rent_amount,
                  askingPrice: property.asking_price,
                });

                return (
                  <>
                    <p className="text-lg font-bold text-[var(--color-deep-slate-blue)]">
                      {price.amount}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {price.qualifier}
                    </p>
                  </>
                );
              })()}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {formatRelativeTime(property.created_at)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={property.agent_contact?.avatar_url ?? null}
                fallback={agentName}
                alt={agentName}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {agentName}
                </p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">
                  {property.agent_contact?.business_name?.trim() || "Listed by agent"}
                </p>
              </div>
            </div>

            {property.is_verified && (
              <Badge variant="verified" size="sm">
                Verified
              </Badge>
            )}
          </div>
        </Link>
      </Card>
  );
}
