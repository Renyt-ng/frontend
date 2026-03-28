"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import {
  usePropertyEngagementStatus,
  useTogglePropertyEngagement,
} from "@/lib/hooks/usePropertyInteractions";

interface PropertyEngagementButtonsProps {
  propertyId: string;
  compact?: boolean;
  onLikeCommitted?: (active: boolean) => void;
}

export function PropertyEngagementButtons({
  propertyId,
  compact = false,
  onLikeCommitted,
}: PropertyEngagementButtonsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const statusQuery = usePropertyEngagementStatus(propertyId, isAuthenticated);
  const toggleEngagement = useTogglePropertyEngagement();
  const [pendingAction, setPendingAction] = useState<"wishlist" | "like" | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [optimisticStatus, setOptimisticStatus] = useState<{
    wishlist: boolean;
    like: boolean;
  } | null>(null);

  const currentUrl = useMemo(
    () => buildCurrentUrl(pathname || `/properties/${propertyId}`, searchParams),
    [pathname, propertyId, searchParams],
  );
  const status = optimisticStatus ?? statusQuery.data?.data ?? { wishlist: false, like: false };

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  function getFeedback(type: "wishlist" | "like", active: boolean) {
    if (type === "wishlist") {
      return active ? "Saved to wishlist" : "Removed from wishlist";
    }

    return active ? "Listing liked" : "Listing unliked";
  }

  async function commitToggle(
    type: "wishlist" | "like",
    currentlyActive: boolean,
  ) {
    const nextValue = !currentlyActive;
    const nextStatus = { ...status, [type]: nextValue };

    setPendingAction(type);
    setOptimisticStatus(nextStatus);

    try {
      await toggleEngagement.mutateAsync({
        propertyId,
        engagementType: type,
        active: currentlyActive,
      });

      setFeedback(getFeedback(type, nextValue));
      if (type === "like") {
        onLikeCommitted?.(nextValue);
      }
      setOptimisticStatus(null);
    } catch {
      setOptimisticStatus(null);
      setFeedback("We couldn't update that action. Try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggle(type: "wishlist" | "like") {
    if (!isAuthenticated) {
      openOverlay({
        mode: "login",
        redirectTo: currentUrl,
        resumeAction: type,
        onAuthenticated: async () => {
          const refreshedStatus = await statusQuery.refetch();
          const nextStatus = refreshedStatus.data?.data ?? {
            wishlist: false,
            like: false,
          };

          await commitToggle(type, nextStatus[type]);
        },
      });
      return;
    }

    await commitToggle(type, status[type]);
  }

  const baseButtonClass = compact
    ? "h-10 w-10 rounded-full border border-white/90 bg-transparent shadow-none backdrop-blur-sm hover:border-white hover:bg-white/10"
    : "h-10 w-10 rounded-full border border-white bg-white text-[var(--color-text-secondary)] shadow-none hover:border-[var(--color-deep-slate-blue)]/30 hover:bg-slate-50";

  const activeButtonClass =
    "border-[var(--color-deep-slate-blue)] bg-[var(--color-deep-slate-blue)] text-white hover:bg-[var(--color-deep-slate-blue)] hover:text-white";

  const inactiveCompactButtonClass = "text-white";
  const inactiveDefaultButtonClass = "text-[var(--color-text-secondary)]";

  const wishlistClass = status.wishlist
    ? activeButtonClass
    : compact
      ? inactiveCompactButtonClass
      : inactiveDefaultButtonClass;

  const likeClass = status.like
    ? activeButtonClass
    : compact
      ? inactiveCompactButtonClass
      : inactiveDefaultButtonClass;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${baseButtonClass} ${wishlistClass}`}
          aria-label="Save to wishlist"
          aria-pressed={status.wishlist}
          disabled={pendingAction === "wishlist"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleToggle("wishlist");
          }}
        >
          <Bookmark className={`h-4 w-4 ${status.wishlist ? "fill-current" : ""}`} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${baseButtonClass} ${likeClass}`}
          aria-label="Like listing"
          aria-pressed={status.like}
          disabled={pendingAction === "like"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleToggle("like");
          }}
        >
          <Heart className={`h-4 w-4 ${status.like ? "fill-current" : ""}`} />
        </Button>
        <span className="sr-only" aria-live="polite">
          {feedback}
        </span>
      </div>
      {!compact && feedback ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{feedback}</p>
      ) : null}
    </>
  );
}