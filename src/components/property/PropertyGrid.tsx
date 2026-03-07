import { cn } from "@/lib/utils";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardSkeleton } from "@/components/ui";
import type { Property, PropertyImage } from "@/types";

interface PropertyGridProps {
  properties: Property[];
  /** Map of property_id → images[], if available */
  imageMap?: Record<string, PropertyImage[]>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function PropertyGrid({
  properties,
  imageMap,
  isLoading,
  emptyMessage = "No properties found",
  className,
}: PropertyGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
          className,
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 h-16 w-16 rounded-full bg-gray-100" />
        <p className="text-lg font-medium text-[var(--color-text-primary)]">
          {emptyMessage}
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Try adjusting your filters or search in a different area.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          images={imageMap?.[property.id]}
        />
      ))}
    </div>
  );
}
