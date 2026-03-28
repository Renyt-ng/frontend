"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocations } from "@/lib/hooks";

interface AreaTagsProps {
  currentArea?: string;
  className?: string;
}

export function AreaTags({ currentArea, className }: AreaTagsProps) {
  const locationsQuery = useLocations({ kind: "area", limit: 12 });
  const areas = locationsQuery.data?.data ?? [];

  if (areas.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {areas.map((area) => (
        <Link
          key={area.slug}
          href={`/search?area=${encodeURIComponent(area.name)}`}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            currentArea === area.name
              ? "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)] text-white"
              : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-deep-slate-blue)]/30 hover:text-[var(--color-text-primary)]",
          )}
        >
          {area.name}
        </Link>
      ))}
    </div>
  );
}
