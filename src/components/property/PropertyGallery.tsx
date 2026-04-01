"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/types";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gray-100">
        <Camera className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={images[currentIndex].image_url}
          alt={`${title} - Photo ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous property image"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--color-text-primary)] opacity-100 shadow-md backdrop-blur-sm transition-opacity touch-manipulation sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next property image"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--color-text-primary)] opacity-100 shadow-md backdrop-blur-sm transition-opacity touch-manipulation sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-sm text-white backdrop-blur-sm">
          <Camera className="h-3.5 w-3.5" />
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View property image ${idx + 1}`}
              className={cn(
                "h-14 w-[4.5rem] flex-shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-20",
                idx === currentIndex
                  ? "border-[var(--color-deep-slate-blue)]"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={img.image_url}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
