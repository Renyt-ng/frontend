import Link from "next/link";
import { BedDouble, Bath, MapPin, ShieldCheck, Camera } from "lucide-react";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils";
import type { Property, PropertyImage } from "@/types";

interface PropertyCardProps {
  property: Property;
  images?: PropertyImage[];
  className?: string;
}

export function PropertyCard({
  property,
  images,
  className,
}: PropertyCardProps) {
  const primaryImage = images?.[0]?.image_url;
  const imageCount = images?.length ?? 0;

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <Card
        className={cn(
          "overflow-hidden transition-all group-hover:-translate-y-0.5",
          className,
        )}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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

          {/* Image count overlay */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
              <Camera className="h-3 w-3" />
              {imageCount}
            </div>
          )}

          {/* Status / Availability badges */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {property.status === "active" && (
              <span className="rounded-md bg-[var(--color-emerald)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Available
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
          <div className="absolute bottom-2 left-2">
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)] backdrop-blur-sm">
              {PROPERTY_TYPE_LABELS[property.property_type] ??
                property.property_type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
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
              <p className="text-lg font-bold text-[var(--color-deep-slate-blue)]">
                {formatCurrency(property.rent_amount)}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                per year
              </p>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {formatRelativeTime(property.created_at)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
