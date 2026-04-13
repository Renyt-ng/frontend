"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualHelpProps {
  label: string;
  title?: string;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function ContextualHelp({
  label,
  title,
  children,
  align = "start",
  className,
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={cn("relative inline-flex flex-shrink-0 align-middle", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-deep-slate-blue)] focus-visible:bg-[var(--color-background)] focus-visible:text-[var(--color-deep-slate-blue)]"
      >
        <CircleAlert className="h-4 w-4" />
      </button>

      {open ? (
        <span
          role="tooltip"
          className={cn(
            "absolute top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {title ? (
            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
              {title}
            </span>
          ) : null}
          <span className="mt-1 block text-sm leading-6 text-[var(--color-text-secondary)]">
            {children}
          </span>
        </span>
      ) : null}
    </span>
  );
}