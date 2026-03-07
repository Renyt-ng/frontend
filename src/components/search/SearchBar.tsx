"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { LAGOS_AREAS } from "@/lib/utils";

interface SearchBarProps {
  /** Initial area value */
  defaultArea?: string;
  /** Compact mode for navbar or inline usage */
  compact?: boolean;
  className?: string;
}

export function SearchBar({
  defaultArea = "",
  compact = false,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [area, setArea] = useState(defaultArea);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered =
    area.length > 0
      ? LAGOS_AREAS.filter((a) => a.toLowerCase().includes(area.toLowerCase()))
      : LAGOS_AREAS;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (area.trim()) {
      router.push(`/search?area=${encodeURIComponent(area.trim())}`);
    } else {
      router.push("/search");
    }
    setShowSuggestions(false);
  }

  function selectArea(selected: string) {
    setArea(selected);
    setShowSuggestions(false);
    router.push(`/search?area=${encodeURIComponent(selected)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:border-[var(--color-deep-slate-blue)]/30",
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
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay so click on suggestion works
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Search by area in Lagos..."
          className={cn(
            "flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none",
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
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
          {filtered.map((a) => (
            <button
              key={a}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectArea(a)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              {a}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
