"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useLocations } from "@/lib/hooks";

export function PopularAreasGrid() {
  const locationsQuery = useLocations({ kind: "area", limit: 12 });
  const areas = locationsQuery.data?.data ?? [];

  if (areas.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {areas.map((area) => (
        <Link
          key={area.slug}
          href={`/search?area=${encodeURIComponent(area.name)}`}
          className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition-all hover:border-[var(--color-deep-slate-blue)]/20 hover:bg-white hover:shadow-sm"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-deep-slate-blue)]/5 transition-colors group-hover:bg-[var(--color-deep-slate-blue)]/10">
            <MapPin className="h-5 w-5 text-[var(--color-deep-slate-blue)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{area.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Browse listings &rarr;
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}