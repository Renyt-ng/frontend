"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gift, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { ReferralProgramModal } from "@/components/referrals";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { getReferralAttribution, persistReferralAttribution } from "@/lib/referrals/attribution";
import { useTrackPropertyMessageIntent } from "@/lib/hooks";
import { buildWhatsAppHref } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import type { PropertyWithImages } from "@/types";

interface PropertyActionPanelProps {
  property: PropertyWithImages;
}

export function PropertyActionPanel({ property }: PropertyActionPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const trackMessageIntent = useTrackPropertyMessageIntent();

  const canInstantApply =
    property.listing_purpose === "rent" &&
    property.application_mode === "instant_apply";
  const agentPhone = property.agent_contact?.phone?.trim() ?? "";
  const currentUrl = useMemo(
    () => buildCurrentUrl(pathname || `/properties/${property.id}`, searchParams),
    [pathname, property.id, searchParams],
  );
  const whatsappHref = useMemo(() => {
    if (!agentPhone) {
      return "";
    }

    return buildWhatsAppHref(
      agentPhone,
      `Hi, I'm interested in ${property.title} in ${property.area} on Renyt.`,
    );
  }, [agentPhone, property.area, property.title]);

  useEffect(() => {
    const queryReferralCode = searchParams.get("ref");

    if (queryReferralCode) {
      persistReferralAttribution(property.id, queryReferralCode);
      setReferralCode(queryReferralCode.trim().toUpperCase());
      return;
    }

    setReferralCode(getReferralAttribution(property.id));
  }, [property.id, searchParams]);

  useEffect(() => {
    const resumeAction = searchParams.get("resumeAction");
    const resumeAuth = searchParams.get("resumeAuth");

    if (!isAuthenticated || resumeAuth !== "1" || !resumeAction) {
      return;
    }

    if (resumeAction === "call" && agentPhone) {
      void maybeTrackReferralContactIntent("phone").finally(() => {
        window.location.href = `tel:${agentPhone}`;
      });
    }

    if (resumeAction === "message" && agentPhone && whatsappHref) {
      void maybeTrackReferralContactIntent("whatsapp").finally(() => {
        window.location.href = whatsappHref;
      });
    }

    router.replace(pathname, { scroll: false });
  }, [agentPhone, isAuthenticated, pathname, router, searchParams, whatsappHref]);

  async function maybeTrackReferralContactIntent(sourceChannel: "whatsapp" | "phone") {
    if (!referralCode) {
      return;
    }

    try {
      await trackMessageIntent.mutateAsync({
        propertyId: property.id,
        data: {
          referral_code: referralCode,
          source_channel: sourceChannel,
        },
      });
    } catch {
      // Contact should continue even if referral tracking fails.
    }
  }

  function handleOpenReferralModal() {
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

    setShowReferralModal(true);
  }

  function handleMessage() {
    if (!isAuthenticated) {
      openOverlay({
        mode: "login",
        redirectTo: currentUrl,
        resumeAction: "message",
        onAuthenticated: async () => {
          if (agentPhone && whatsappHref) {
            await maybeTrackReferralContactIntent("whatsapp");
            window.location.href = whatsappHref;
          }
        },
      });
      return;
    }

    if (agentPhone && whatsappHref) {
      void maybeTrackReferralContactIntent("whatsapp").finally(() => {
        window.location.href = whatsappHref;
      });
    }
  }

  function handleCall() {
    if (!isAuthenticated) {
      openOverlay({
        mode: "login",
        redirectTo: currentUrl,
        resumeAction: "call",
        onAuthenticated: async () => {
          if (agentPhone) {
            await maybeTrackReferralContactIntent("phone");
            window.location.href = `tel:${agentPhone}`;
          }
        },
      });
      return;
    }

    if (agentPhone) {
      void maybeTrackReferralContactIntent("phone");
      window.location.href = `tel:${agentPhone}`;
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-5">
          {property.listing_purpose === "rent" ? (
            canInstantApply ? (
              <Link href={`/properties/${property.id}/apply`} className="block">
                <Button size="lg" className="w-full">
                  Apply for This Property
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4" />
                Message Agent
              </Button>
            )
          ) : (
            <Button size="lg" className="w-full" onClick={handleMessage}>
              <MessageCircle className="h-4 w-4" />
              Message Agent
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" className="w-full" onClick={handleCall}>
              <Phone className="h-4 w-4" />
              Call Agent
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={handleMessage}>
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          </div>

          <Button variant="secondary" size="sm" className="w-full" onClick={handleOpenReferralModal}>
            <Gift className="h-4 w-4" />
            Share and Earn
          </Button>
        </CardContent>
      </Card>
      <ReferralProgramModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        property={property}
      />
    </>
  );
}