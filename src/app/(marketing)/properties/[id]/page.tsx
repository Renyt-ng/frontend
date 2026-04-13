import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Video,
} from "lucide-react";
import { Container } from "@/components/layout";
import {
  PropertyGallery,
  PropertyAgentCard,
  PropertySpecs,
  PricingBreakdown,
  PropertyEngagementButtons,
  PropertyViewTracker,
} from "@/components/property";
import { PropertyActionPanel } from "@/components/property/PropertyActionPanel";
import { ReferralShareTriggerButton } from "@/components/referrals";
import { Badge } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared";
import { propertiesApi } from "@/lib/api";
import {
  buildAbsoluteSiteUrl,
  formatDate,
  formatListingPurpose,
  formatPropertyPriceLabel,
  formatPropertyType,
  getPropertyFreshnessBadgeVariant,
  getPropertyFreshnessLabel,
  getPropertyFreshnessMeta,
} from "@/lib/utils";
import type { PropertyWithImages } from "@/types";
import { WalkthroughVideoPlayer } from "@/components/property/WalkthroughVideoPlayer";
import { PropertyStickyCta } from "@/components/property/PropertyStickyCta";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

function resolveSharePreviewImageUrl(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return buildAbsoluteSiteUrl(imageUrl);
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await propertiesApi.getProperty(id);
    const property = res.data;
    const propertyUrl = buildAbsoluteSiteUrl(`/properties/${property.id}`);
    const previewImage =
      property.images?.find((image) => image.is_cover)?.image_url ??
      property.images?.[0]?.image_url ??
      "/logo-primary.png";
    const previewImageUrl = resolveSharePreviewImageUrl(previewImage);
    const price = formatPropertyPriceLabel({
      listingPurpose: property.listing_purpose,
      propertyType: property.property_type,
      rentAmount: property.rent_amount,
      askingPrice: property.asking_price,
      isPriceNegotiable: property.is_price_negotiable,
    });
    const title = `${property.title} in ${property.area}`;
    const priceDescription = price.qualifier
      ? `${price.amount} ${price.qualifier}`
      : price.amount;
    const description = `${formatPropertyType(property.property_type)} ${formatListingPurpose(property.listing_purpose).toLowerCase()} in ${property.area}. ${property.bedrooms} bed, ${property.bathrooms} bath. ${priceDescription}.`;

    return {
      title,
      description,
      alternates: {
        canonical: propertyUrl,
      },
      openGraph: {
        type: "website",
        url: propertyUrl,
        title,
        description,
        images: [
          {
            url: previewImageUrl,
            alt: property.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [previewImageUrl],
      },
    };
  } catch {
    return { title: "Property Not Found" };
  }
}

export default async function PropertyDetailPage({
  params,
}: PropertyPageProps) {
  const { id } = await params;

  let property: PropertyWithImages | null = null;
  try {
    const res = await propertiesApi.getProperty(id);
    property = res.data;
  } catch {
    /* API unreachable */
  }

  if (!property) notFound();

  const images = property.images ?? property.property_images ?? [];
  const freshnessLabel = getPropertyFreshnessLabel(property);
  const freshnessMeta = getPropertyFreshnessMeta(property);

  return (
    <div className="min-w-0 pb-32 lg:pb-16">
      <PropertyViewTracker propertyId={property.id} />
      <PropertyStickyCta property={property} />

      <Container size="lg" className="mt-4 sm:mt-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto mb-5 w-full max-w-3xl lg:mb-6 lg:max-w-none">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <Link
                href="/search"
                className="flex items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Link>
              <span className="text-[var(--color-border)]">/</span>
              <span className="max-w-full break-words text-[var(--color-text-secondary)]">
                {property.area}
              </span>
              <span className="text-[var(--color-border)]">/</span>
              <span className="min-w-0 flex-1 break-words text-[var(--color-text-primary)]">
                {property.title}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-8 lg:grid-cols-3">
          {/* ─── Left column (2/3) ─────────────────── */}
            <div className="mx-auto w-full max-w-3xl space-y-8 lg:col-span-2 lg:max-w-none">
            {/* Gallery — full-bleed on mobile */}
            <div className="-mx-4 sm:-mx-6 lg:mx-0">
              <PropertyGallery images={images} title={property.title} />
            </div>

            <PricingBreakdown property={property} />

            {/* Title & Meta */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                  {property.title}
                </h1>
                {property.is_verified && <VerifiedBadge />}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)] sm:gap-4">
                <span className="flex min-w-0 items-center gap-1 break-words">
                  <MapPin className="h-4 w-4" />
                  {property.address_line ?? property.area}
                </span>
                <Badge variant="default">
                  {formatPropertyType(property.property_type)}
                </Badge>
                <Badge variant={property.listing_purpose === "sale" ? "verified" : "info"}>
                  {formatListingPurpose(property.listing_purpose)}
                </Badge>
                <Badge variant={getPropertyFreshnessBadgeVariant(property)}>
                  {freshnessLabel}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {formatDate(property.created_at)}
                </span>
              </div>

              {freshnessMeta ? (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {freshnessMeta}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-start gap-4 border-t border-[var(--color-border)] pt-4">
                <PropertyEngagementButtons propertyId={property.id} />
                <div className="lg:hidden">
                  <ReferralShareTriggerButton
                    property={property}
                    variant="secondary"
                    size="sm"
                    label="Share and Earn"
                  />
                </div>
              </div>

            </div>

            {/* Specs */}
            <PropertySpecs property={property} />

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                  About This Property
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {property.description}
                </p>
              </div>
            )}

            {property.property_videos?.[0] && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                  <Video className="h-5 w-5" />
                  Walkthrough Video
                </h2>
                <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-black">
                  <WalkthroughVideoPlayer
                    src={property.property_videos[0].video_url}
                    type={property.property_videos[0].mime_type ?? "video/mp4"}
                    title={property.title}
                  />
                </div>
              </div>
            )}

            {/* Key Features */}
            {/* <div>
              <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                Key Features
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Secure estate",
                  "24/7 power supply",
                  "Fitted kitchen",
                  "En-suite rooms",
                  "CCTV surveillance",
                  "Dedicated parking",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-emerald)]" />
                    {feature}
                  </div>
                ))}
              </div>
            </div> */}
            </div>

          {/* ─── Right column (1/3) — Sticky sidebar ── */}
            <div className="mx-auto w-full max-w-3xl space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-w-none">
              <PropertyAgentCard property={property} />

              <div className="hidden lg:block">
                <PropertyActionPanel property={property} />
              </div>

              {/* Safety notice */}
              <div className="rounded-xl border border-[var(--color-emerald)]/20 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-emerald)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {property.is_verified ? "Verified Listing" : "Verification In Progress"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {property.is_verified
                        ? "This property has been verified by the Renyt team. The agent is ID-verified and approved."
                        : "This listing is visible, but final property verification is still pending review by the Renyt team."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {freshnessLabel}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {property.discovery_bookable === false
                    ? property.discovery_available_from
                      ? `This shortlet is currently booked. It remains visible for planning and should be available again from ${new Date(property.discovery_available_from).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}, once the agent reconfirms it.`
                      : "This shortlet is currently awaiting host confirmation before it can accept new contact."
                    : property.freshness_state === "fresh"
                      ? "This listing was recently reconfirmed by the agent and is still open for direct contact."
                      : property.freshness_state === "confirmation_due"
                        ? "This listing is temporarily being reconfirmed. Contact response may be slower until the agent refreshes availability."
                        : "This listing is no longer active for new contact."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
