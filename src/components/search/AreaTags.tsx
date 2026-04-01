"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocations } from "@/lib/hooks";

interface AreaTagsProps {
  currentArea?: string;
  className?: string;
}

export function AreaTags({ currentArea, className }: AreaTagsProps) {
  const searchParams = useSearchParams();
  const locationsQuery = useLocations({ kind: "area", limit: 12 });
  const areas = locationsQuery.data?.data ?? [];

  function buildAreaHref(areaName: string, areaSlug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("area", areaName);
    params.set("location_slug", areaSlug);
    params.delete("page");

    return `/search?${params.toString()}`;
  }

  if (areas.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {areas.map((area) => (
        <Link
          key={area.slug}
          href={buildAreaHref(area.name, area.slug)}
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
