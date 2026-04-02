"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Gift, MessageCircle, Phone } from "lucide-react";
import { buttonVariants, Button, Card, CardContent } from "@/components/ui";
import { ReferralProgramModal } from "@/components/referrals";
import { buildCurrentUrl } from "@/lib/authNavigation";
import { getReferralAttribution, persistReferralAttribution } from "@/lib/referrals/attribution";
import { useTrackPropertyMessageIntent } from "@/lib/hooks";
import {
  buildAbsoluteSiteUrl,
  buildPropertyWhatsAppMessage,
  buildWhatsAppHref,
  cn,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import type { PropertyWithImages } from "@/types";

interface PropertyActionPanelProps {
  property: PropertyWithImages;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2c-5.45 0-9.89 4.43-9.9 9.88a9.86 9.86 0 0 0 1.35 4.98L2 22l5.27-1.38a9.9 9.9 0 0 0 4.73 1.2h.01c5.45 0 9.89-4.43 9.9-9.88a9.8 9.8 0 0 0-2.86-7.03Zm-7.02 15.24h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.18 8.18 0 0 1-1.27-4.38c0-4.53 3.7-8.22 8.24-8.22a8.17 8.17 0 0 1 5.83 2.42 8.14 8.14 0 0 1 2.4 5.81c0 4.54-3.69 8.23-8.2 8.23Zm4.51-6.16c-.25-.13-1.47-.72-1.7-.8-.22-.08-.38-.13-.54.13-.16.25-.62.8-.76.97-.14.16-.28.19-.53.06-.25-.13-1.04-.38-1.98-1.2-.73-.65-1.22-1.44-1.37-1.69-.14-.25-.02-.38.11-.5.11-.11.25-.28.37-.41.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.44-.06-.13-.54-1.3-.74-1.78-.2-.47-.39-.41-.54-.42l-.46-.01c-.16 0-.41.06-.63.31-.22.25-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.47-.6 1.68-1.17.21-.57.21-1.06.15-1.16-.06-.09-.22-.15-.47-.28Z" />
    </svg>
  );
}

export function PropertyActionPanel({ property }: PropertyActionPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const openOverlay = useAuthOverlayStore((state) => state.openOverlay);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const trackMessageIntent = useTrackPropertyMessageIntent();

  const agentPhone = property.agent_contact?.phone?.trim() ?? "";
  const agentWhatsAppPhone = property.agent_contact?.whatsapp_phone?.trim() ?? agentPhone;
  const propertyPath = pathname || `/properties/${property.id}`;
  const currentUrl = useMemo(
    () => buildCurrentUrl(propertyPath, searchParams),
    [propertyPath, searchParams],
  );
  const propertyShareUrl = useMemo(
    () => buildAbsoluteSiteUrl(propertyPath),
    [propertyPath],
  );
  const whatsappHref = useMemo(() => {
    if (!agentWhatsAppPhone) {
      return "";
    }

    return buildWhatsAppHref(
      agentWhatsAppPhone,
      buildPropertyWhatsAppMessage({
        title: property.title,
        area: property.area,
        propertyUrl: propertyShareUrl,
      }),
    );
  }, [agentWhatsAppPhone, property.area, property.title, propertyShareUrl]);
  const phoneHref = agentPhone ? `tel:${agentPhone}` : "";

  useEffect(() => {
    const queryReferralCode = searchParams.get("ref");

    if (queryReferralCode) {
      persistReferralAttribution(property.id, queryReferralCode);
      setReferralCode(queryReferralCode.trim().toUpperCase());
      return;
    }

    setReferralCode(getReferralAttribution(property.id));
  }, [property.id, searchParams]);

  function getActiveReferralCode() {
    const queryReferralCode = searchParams.get("ref")?.trim().toUpperCase();

    if (queryReferralCode) {
      return queryReferralCode;
    }

    return getReferralAttribution(property.id);
  }

  async function maybeTrackReferralContactIntent(sourceChannel: "whatsapp" | "phone") {
    const activeReferralCode = getActiveReferralCode();

    if (!activeReferralCode) {
      return;
    }

    try {
      await trackMessageIntent.mutateAsync({
        propertyId: property.id,
        data: {
          referral_code: activeReferralCode,
          source_channel: sourceChannel,
        },
      });
    } catch {
      // Contact should continue even if referral tracking fails.
    }
  }

  function handleContactClick(sourceChannel: "whatsapp" | "phone") {
    void maybeTrackReferralContactIntent(sourceChannel);
  }

  function resumeContactFlow(
    sourceChannel: "whatsapp" | "phone",
    href: string,
    options?: { openInNewWindow?: boolean },
  ) {
    openOverlay({
      mode: "login",
      redirectTo: currentUrl,
      resumeAction: sourceChannel === "whatsapp" ? "message" : "call",
      onAuthenticated: async () => {
        await maybeTrackReferralContactIntent(sourceChannel);

        if (options?.openInNewWindow) {
          const nextWindow = window.open(href, "_blank", "noopener,noreferrer");

          if (nextWindow) {
            nextWindow.focus?.();
            return;
          }

          window.location.assign(href);
          return;
        }

        window.location.assign(href);
      },
    });
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

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-5">
          {whatsappHref ? (
            isAuthenticated ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleContactClick("whatsapp")}
                className={cn(buttonVariants({ size: "lg" }), "flex w-full")}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Message Agent
              </a>
            ) : (
              <Button
                size="lg"
                className="w-full"
                type="button"
                onClick={() =>
                  resumeContactFlow("whatsapp", whatsappHref, {
                    openInNewWindow: true,
                  })
                }
              >
                <WhatsAppIcon className="h-4 w-4" />
                Message Agent
              </Button>
            )
          ) : (
            <Button size="lg" className="w-full" type="button" disabled>
              <MessageCircle className="h-4 w-4" />
              Agent chat unavailable
            </Button>
          )}

          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Message the listing agent directly on WhatsApp for the fastest response. Call remains available if you prefer a direct phone conversation.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {phoneHref ? (
              isAuthenticated ? (
                <a
                  href={phoneHref}
                  onClick={() => handleContactClick("phone")}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "flex w-full",
                  )}
                >
                  <Phone className="h-4 w-4" />
                  Call Agent
                </a>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  type="button"
                  onClick={() => resumeContactFlow("phone", phoneHref)}
                >
                  <Phone className="h-4 w-4" />
                  Call Agent
                </Button>
              )
            ) : (
              <Button variant="secondary" size="sm" className="w-full" type="button" disabled>
                <Phone className="h-4 w-4" />
                Call unavailable
              </Button>
            )}
            {whatsappHref ? (
              isAuthenticated ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => handleContactClick("whatsapp")}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "flex w-full",
                  )}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Open WhatsApp
                </a>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  type="button"
                  onClick={() =>
                    resumeContactFlow("whatsapp", whatsappHref, {
                      openInNewWindow: true,
                    })
                  }
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Open WhatsApp
                </Button>
              )
            ) : (
              <Button variant="secondary" size="sm" className="w-full" type="button" disabled>
                <MessageCircle className="h-4 w-4" />
                WhatsApp unavailable
              </Button>
            )}
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