"use client";

import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/lib/hooks";
import type { Location } from "@/types";

interface SearchBarProps {
  /** Initial area value */
  defaultArea?: string;
  defaultLocationSlug?: string;
  /** Compact mode for navbar or inline usage */
  compact?: boolean;
  className?: string;
}

export function SearchBar({
  defaultArea = "",
  defaultLocationSlug = "",
  compact = false,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [area, setArea] = useState(defaultArea);
  const [locationSlug, setLocationSlug] = useState(defaultLocationSlug);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const deferredArea = useDeferredValue(area.trim());

  useEffect(() => {
    setArea(defaultArea);
  }, [defaultArea]);

  useEffect(() => {
    setLocationSlug(defaultLocationSlug);
  }, [defaultLocationSlug]);

  const locationsQuery = useLocations({
    q: deferredArea || undefined,
    kind: "all",
    limit: deferredArea ? 8 : 0,
  });
  const filtered = locationsQuery.data?.data ?? [];

  function buildSearchUrl(nextArea: string, nextLocationSlug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedArea = nextArea.trim();

    if (trimmedArea) {
      params.set("area", trimmedArea);
    } else {
      params.delete("area");
    }

    if (nextLocationSlug) {
      params.set("location_slug", nextLocationSlug);
    } else {
      params.delete("location_slug");
    }

    params.delete("page");

    return `/search${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(buildSearchUrl(area, locationSlug || undefined));
    setShowSuggestions(false);
  }

  function selectArea(location: Location) {
    setArea(location.name);
    setLocationSlug(location.slug);
    setShowSuggestions(false);
    router.push(buildSearchUrl(location.name, location.slug));
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-shadow focus-within:shadow-md",
          compact ? "h-11" : "h-14",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-4 text-[var(--color-text-secondary)]",
            compact && "px-3",
          )}
        >
          <MapPin
            className={cn("flex-shrink-0", compact ? "h-4 w-4" : "h-5 w-5")}
          />
        </div>
        <input
          type="text"
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setLocationSlug("");
            setShowSuggestions(e.target.value.trim().length > 0);
          }}
          onFocus={() => setShowSuggestions(area.trim().length > 0)}
          onBlur={() => {
            // Delay so click on suggestion works
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Search by area in Lagos..."
          className={cn(
            "search-field-reset flex-1 border-0 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
            compact ? "text-sm" : "text-base",
          )}
        />
        <button
          type="submit"
          className={cn(
            "flex items-center justify-center bg-[var(--color-deep-slate-blue)] text-white transition-colors hover:bg-[#162d4a]",
            compact ? "h-full w-11" : "m-1.5 h-10 w-10 rounded-xl",
          )}
        >
          <Search className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && area.trim().length > 0 && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
          {filtered.map((location) => (
            <button
              key={location.slug}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectArea(location)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              <span>{location.display_name}</span>
              <span className="ml-auto text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                {location.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
