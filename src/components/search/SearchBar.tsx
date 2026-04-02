"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocations } from "@/lib/hooks";
import type { Location } from "@/types";

interface SearchSelection {
  area: string;
  locationSlug?: string;
}

interface SearchBarProps {
  /** Initial area value */
  defaultArea?: string;
  defaultLocationSlug?: string;
  /** Compact mode for navbar or inline usage */
  compact?: boolean;
  className?: string;
  navigateOnSearch?: boolean;
  onSearch?: (selection: SearchSelection) => void;
}

export function SearchBar({
  defaultArea = "",
  defaultLocationSlug = "",
  compact = false,
  className,
  navigateOnSearch = true,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [area, setArea] = useState(defaultArea);
  const [locationSlug, setLocationSlug] = useState(defaultLocationSlug);
  const [debouncedArea, setDebouncedArea] = useState(defaultArea.trim());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const trimmedArea = area.trim();
  const shouldQuerySuggestions = trimmedArea.length >= 2;

  useEffect(() => {
    setArea(defaultArea);
    setDebouncedArea(defaultArea.trim());
  }, [defaultArea]);

  useEffect(() => {
    setLocationSlug(defaultLocationSlug);
  }, [defaultLocationSlug]);

  useEffect(() => {
    const nextValue = trimmedArea;

    if (nextValue.length < 2) {
      setDebouncedArea("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedArea(nextValue);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedArea]);

  const locationsQuery = useLocations({
    q: debouncedArea || undefined,
    kind: "all",
    limit: debouncedArea ? 8 : 0,
  }, {
    enabled: debouncedArea.length >= 2,
  });
  const filtered = locationsQuery.data?.data ?? [];

  function commitSearch(nextArea: string, nextLocationSlug?: string) {
    onSearch?.({ area: nextArea.trim(), locationSlug: nextLocationSlug });

    if (navigateOnSearch) {
      router.push(buildSearchUrl(nextArea, nextLocationSlug));
    }
  }

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
    setShowSuggestions(false);
    commitSearch(area, locationSlug || undefined);
  }

  function selectArea(location: Location) {
    setArea(location.name);
    setLocationSlug(location.slug);
    setShowSuggestions(false);
    commitSearch(location.name, location.slug);
  }

  const shouldShowDropdown = showSuggestions && trimmedArea.length > 0;
  const shouldShowSuggestions = shouldShowDropdown && shouldQuerySuggestions && filtered.length > 0;
  const shouldShowLoading = shouldShowDropdown && shouldQuerySuggestions && locationsQuery.isLoading;
  const shouldShowEmpty =
    shouldShowDropdown &&
    shouldQuerySuggestions &&
    !locationsQuery.isLoading &&
    filtered.length === 0;
  const shouldShowMinCharacters = shouldShowDropdown && !shouldQuerySuggestions;

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
          onFocus={() => setShowSuggestions(trimmedArea.length > 0)}
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
      {(shouldShowSuggestions || shouldShowLoading || shouldShowEmpty || shouldShowMinCharacters) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
          {shouldShowMinCharacters && (
            <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Type at least 2 characters to see location suggestions.
            </div>
          )}

          {shouldShowLoading && (
            <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Searching locations...
            </div>
          )}

          {shouldShowSuggestions && filtered.map((location) => (
            <button
              key={location.slug}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectArea(location)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-gray-50"
            >
              <MapPin className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              <span>{location.display_name}</span>
              <span className="ml-auto text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                {location.kind}
              </span>
            </button>
          ))}

          {shouldShowEmpty && (
            <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              No matching locations found.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
