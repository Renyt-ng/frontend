"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PropertyWithImages } from "@/types";
import { PropertyActionPanel } from "./PropertyActionPanel";

interface PropertyStickyCtaProps {
  property: PropertyWithImages;
}

export function PropertyStickyCta({ property }: PropertyStickyCtaProps) {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterVisible(entry.isIntersecting);
      },
      {
        threshold: 0.05,
      },
    );

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-label="Sticky property actions"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 transition-all duration-200 lg:hidden",
        footerVisible
          ? "pointer-events-none translate-y-full opacity-0"
          : "translate-y-0 opacity-100",
      )}
    >
      <div className="mx-auto max-w-3xl rounded-[1.4rem] border border-[var(--color-border)] bg-white/95 p-3 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
        <PropertyActionPanel property={property} variant="sticky" />
      </div>
    </div>
  );
}