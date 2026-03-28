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
} from "@/components/property";
import { PropertyActionPanel } from "@/components/property/PropertyActionPanel";
import { Badge } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared";
import { propertiesApi } from "@/lib/api";
import { formatDate, formatListingPurpose, formatPropertyPriceLabel, formatPropertyType } from "@/lib/utils";
import type { PropertyWithImages } from "@/types";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await propertiesApi.getProperty(id);
    const property = res.data;
    const price = formatPropertyPriceLabel({
      listingPurpose: property.listing_purpose,
      rentAmount: property.rent_amount,
      askingPrice: property.asking_price,
    });
    return {
      title: `${property.title} in ${property.area}`,
      description: `${formatPropertyType(property.property_type)} ${formatListingPurpose(property.listing_purpose).toLowerCase()} in ${property.area}. ${property.bedrooms} bed, ${property.bathrooms} bath. ${price.amount} ${price.qualifier}.`,
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
  const price = formatPropertyPriceLabel({
    listingPurpose: property.listing_purpose,
    rentAmount: property.rent_amount,
    askingPrice: property.asking_price,
  });

  return (
    <div className="pb-16">
      {/* Breadcrumb bar */}
      <div className="border-b border-[var(--color-border)] bg-white py-3">
        <Container>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/search"
              className="flex items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
            <span className="text-[var(--color-border)]">/</span>
            <span className="text-[var(--color-text-secondary)]">
              {property.area}
            </span>
            <span className="text-[var(--color-border)]">/</span>
            <span className="line-clamp-1 text-[var(--color-text-primary)]">
              {property.title}
            </span>
          </div>
        </Container>
      </div>

      <Container className="mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─── Left column (2/3) ─────────────────── */}
          <div className="space-y-8 lg:col-span-2">
            {/* Gallery */}
            <PropertyGallery images={images} title={property.title} />

            {/* Title & Meta */}
            <div>
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                  {property.title}
                </h1>
                {property.is_verified && <VerifiedBadge />}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {property.address_line ?? property.area}
                </span>
                <Badge variant="default">
                  {formatPropertyType(property.property_type)}
                </Badge>
                <Badge variant={property.listing_purpose === "sale" ? "verified" : "info"}>
                  {formatListingPurpose(property.listing_purpose)}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {formatDate(property.created_at)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-start gap-4 border-t border-[var(--color-border)] pt-4">
                <PropertyEngagementButtons propertyId={property.id} />
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
                  <video controls preload="metadata" className="w-full">
                    <source
                      src={property.property_videos[0].video_url}
                      type={property.property_videos[0].mime_type ?? "video/mp4"}
                    />
                  </video>
                </div>
              </div>
            )}

            {/* Key Features */}
            <div>
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
            </div>
          </div>

          {/* ─── Right column (1/3) — Sticky sidebar ── */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {property.listing_purpose === "rent" ? (
              <PricingBreakdown property={property} />
            ) : (
              <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Asking Price
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--color-deep-slate-blue)]">
                  {price.amount}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Agent-led contact intent only in this release.
                </p>
              </div>
            )}

            <PropertyAgentCard property={property} />

            <PropertyActionPanel property={property} />

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
          </div>
        </div>
      </Container>
    </div>
  );
}
