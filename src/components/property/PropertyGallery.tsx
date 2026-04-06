"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/types";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const prev = useCallback(
    () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1)),
    [images.length],
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen, prev, next]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gray-100">
        <Camera className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image — full-bleed on mobile */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFullscreen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFullscreen(true);
            }
          }}
          className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-none bg-gray-100 sm:aspect-[16/9] sm:rounded-2xl"
        >
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
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous property image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--color-text-primary)] opacity-100 shadow-md backdrop-blur-sm transition-opacity touch-manipulation sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
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

        {/* Thumbnails — hidden on mobile, visible on sm+ */}
        {images.length > 1 && (
          <div className="hidden min-w-0 overflow-hidden sm:block">
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`View property image ${idx + 1}`}
                  className={cn(
                    "h-16 w-20 flex-shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-colors",
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
          </div>
        )}
      </div>

      {/* ─── Fullscreen lightbox ─────────────────── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          role="dialog"
          aria-label="Fullscreen image viewer"
          aria-modal="true"
        >
          {/* Header bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
              {currentIndex + 1} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close fullscreen view"
              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image */}
          <img
            src={images[currentIndex].image_url}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/80 touch-manipulation"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/80 touch-manipulation"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
