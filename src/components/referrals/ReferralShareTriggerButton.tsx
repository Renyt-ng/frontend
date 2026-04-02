"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { useMyAgent } from "@/lib/hooks";
import { buildAbsoluteSiteUrl } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import { Button, type ButtonProps } from "@/components/ui";
import {
  ReferralProgramModal,
  type ReferralShareProperty,
} from "./ReferralProgramModal";

interface ReferralShareTriggerButtonProps {
  property: ReferralShareProperty;
  label?: string;
  ariaLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function ReferralShareTriggerButton({
  property,
  label = "Share",
  ariaLabel,
  variant = "secondary",
  size = "sm",
  className,
}: ReferralShareTriggerButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const myAgentQuery = useMyAgent({
    enabled: isAuthenticated && user?.role === "agent",
  });
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const currentUrl = buildCurrentUrl(pathname || `/properties/${property.id}`, searchParams);
  const propertyUrl = buildAbsoluteSiteUrl(`/properties/${property.id}`);
  const currentAgentId = myAgentQuery.data?.data?.id ?? null;
  const isOwnedByCurrentAgent =
    isAuthenticated && user?.role === "agent" && currentAgentId === property.agent_id;

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  function setTemporaryFeedback(message: string) {
    setShareFeedback(message);

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setShareFeedback(null);
    }, 2000);
  }

  async function handleDirectShare() {
    const shareData = {
      title: property.title,
      text: `${property.title} in ${property.area} on Renyt`,
      url: propertyUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setTemporaryFeedback("Shared");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(propertyUrl);
      setTemporaryFeedback("Link copied");
    }
  }

  function handleOpen() {
    if (!isAuthenticated) {
      openOverlay({
        mode: "login",
        redirectTo: currentUrl,
        onAuthenticated: async () => {
          setShowReferralModal(true);
        },
      });
      return;
    }

    if (isOwnedByCurrentAgent) {
      void handleDirectShare();
      return;
    }

    setShowReferralModal(true);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        aria-label={ariaLabel ?? label}
        onClick={handleOpen}
      >
        <Share2 className="h-4 w-4" />
        {shareFeedback ?? label}
      </Button>
      <ReferralProgramModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        property={property}
      />
    </>
  );
}