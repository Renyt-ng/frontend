"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Gift, Share2, ShieldCheck, Wallet } from "lucide-react";
import { Badge, Button, Card, CardContent, Modal } from "@/components/ui";
import {
  useCreateReferralShareLink,
  useEnrollReferralProgram,
  useReferralDashboard,
  useReferralPropertyPreview,
} from "@/lib/hooks";
import { formatCurrency, formatPropertyType } from "@/lib/utils";
import type {
  PropertyWithImages,
  ReferralCommissionPreview,
  ReferralShareChannel,
} from "@/types";

interface ReferralProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyWithImages;
}

function commissionSummary(preview: ReferralCommissionPreview) {
  if (preview.commission_type === "percentage") {
    return {
      title: `${preview.commission_value}% of ${preview.commission_basis_label ?? "eligible amount"}`,
      helper: `Current estimate: ${formatCurrency(preview.estimated_amount)}`,
    };
  }

  return {
    title: formatCurrency(preview.estimated_amount),
    helper: "Estimated earning for a valid qualified message",
  };
}

export function ReferralProgramModal({
  isOpen,
  onClose,
  property,
}: ReferralProgramModalProps) {
  const dashboardQuery = useReferralDashboard({ enabled: isOpen });
  const previewQuery = useReferralPropertyPreview(property.id, { enabled: isOpen });
  const enrollReferralProgram = useEnrollReferralProgram();
  const createShareLink = useCreateReferralShareLink();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const profile = dashboardQuery.data?.data.profile ?? null;
  const preview =
    previewQuery.data?.data.preview ??
    ({
      commission_type: "fixed",
      commission_value: 0,
      commission_basis_label: null,
      commission_basis_amount: null,
      estimated_amount: 0,
    } as ReferralCommissionPreview);
  const summary = useMemo(() => commissionSummary(preview), [preview]);
  const previewState = previewQuery.data?.data ?? null;

  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      setError(null);
      setAcceptedTerms(false);
    }
  }, [isOpen]);

  async function handleEnroll() {
    setError(null);

    if (!acceptedTerms) {
      setError("Accept the referral terms before joining the program.");
      return;
    }

    try {
      await enrollReferralProgram.mutateAsync({
        accepted_terms: true,
        terms_version: previewState?.terms_version ?? "launch-v1",
      });
      setFeedback("Your referral code is ready. Share this property to start tracking earnings.");
    } catch (enrollmentError) {
      setError(
        enrollmentError instanceof Error
          ? enrollmentError.message
          : "Could not start the referral program right now",
      );
    }
  }

  async function handleShare(channel: ReferralShareChannel) {
    setFeedback(null);
    setError(null);

    if (previewState && !previewState.program_enabled) {
      setError("Referral sharing is currently paused by admin settings.");
      return;
    }

    try {
      const response = await createShareLink.mutateAsync({
        propertyId: property.id,
        data: {
          origin: window.location.origin,
          channel,
        },
      });

      const shareUrl = response.data.share_url;
      const shareText = `${property.title} in ${property.area} on Renyt. View it here: ${shareUrl}`;

      if (channel === "copy_link") {
        await navigator.clipboard.writeText(shareUrl);
        setFeedback("Referral link copied. Share it anywhere and track potential earnings in your dashboard.");
        return;
      }

      if (channel === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          "_blank",
          "noopener,noreferrer",
        );
        setFeedback("WhatsApp share ready. We have recorded this property as shared.");
        return;
      }

      if (channel === "native_share" && navigator.share) {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        });
        setFeedback("Share recorded. Your dashboard will update as referrals convert.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Native sharing is not available here, so the referral link has been copied instead.");
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "Could not create a referral share link right now",
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? "Share and earn" : "Start earning by sharing"}
      className="space-y-5"
      ariaLabel="Referral sharing dialog"
    >
      {dashboardQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-gray-50" />
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : !profile ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-deep-slate-blue)]/10 text-[var(--color-deep-slate-blue)]">
                <Gift className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Earn by sharing verified homes
                </h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Join the referral program once, then share any eligible property with your own link and track potential earnings when a valid visitor messages the agent.
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Current property preview
                  </p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {property.title}
                  </p>
                </div>
                {property.is_verified ? <Badge variant="verified">Verified</Badge> : null}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {formatPropertyType(property.property_type)} in {property.area}
              </p>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Commission preview
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
                  {summary.title}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {summary.helper}
                </p>
                {previewState?.campaign_name ? (
                  <p className="mt-2 text-xs text-emerald-800">
                    Active campaign: {previewState.campaign_name}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {previewState && !previewState.program_enabled ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Referral sharing is paused right now. You can still browse the property, but new referral links are temporarily disabled.
            </div>
          ) : null}

          {feedback ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
              {error}
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-deep-slate-blue)]"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              I agree to the <Link href="/referral-terms" target="_blank" className="text-[var(--color-deep-slate-blue)] hover:underline">Refer &amp; Earn Terms</Link> for this launch program version.
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleEnroll}
              isLoading={enrollReferralProgram.isPending}
              disabled={previewState ? !previewState.program_enabled || !acceptedTerms : !acceptedTerms}
            >
              <Wallet className="h-4 w-4" />
              Join referral program
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Referral code
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg font-semibold tracking-wide text-[var(--color-text-primary)]">
                      {profile.referral_code}
                    </p>
                    <Badge variant="info">Active</Badge>
                  </div>
                </div>
                {property.is_verified ? (
                  <Badge variant="verified">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified listing
                  </Badge>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {property.title}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {formatPropertyType(property.property_type)} in {property.area}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Potential earning
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                  {summary.title}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {summary.helper}
                </p>
                {previewState?.campaign_name ? (
                  <p className="mt-2 text-xs text-emerald-800">
                    Active campaign: {previewState.campaign_name}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {previewState && !previewState.program_enabled ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Referral sharing is paused right now. Existing links remain visible in reports, but new shares are disabled.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => handleShare("copy_link")}
              isLoading={createShareLink.isPending}
              disabled={previewState ? !previewState.program_enabled : false}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleShare("whatsapp")}
              isLoading={createShareLink.isPending}
              disabled={previewState ? !previewState.program_enabled : false}
            >
              <Share2 className="h-4 w-4" />
              Share to WhatsApp
            </Button>
            <Button
              className="sm:col-span-2"
              onClick={() => handleShare("native_share")}
              isLoading={createShareLink.isPending}
              disabled={previewState ? !previewState.program_enabled : false}
            >
              <Gift className="h-4 w-4" />
              Share this property
            </Button>
          </div>

          {feedback ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}