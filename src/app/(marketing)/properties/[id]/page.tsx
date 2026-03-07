import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Container } from "@/components/layout";
import {
  PropertyGallery,
  PropertySpecs,
  PricingBreakdown,
} from "@/components/property";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { VerifiedBadge } from "@/components/shared";
import { propertiesApi } from "@/lib/api";
import { formatCurrency, formatDate, PROPERTY_TYPE_LABELS } from "@/lib/utils";
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
    return {
      title: `${property.title} in ${property.area}`,
      description: `${PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type} for rent in ${property.area}. ${property.bedrooms} bed, ${property.bathrooms} bath. ${formatCurrency(property.rent_amount)}/year.`,
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

  const images = property.images ?? [];

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
                  {PROPERTY_TYPE_LABELS[property.property_type] ??
                    property.property_type}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {formatDate(property.created_at)}
                </span>
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
            {/* Pricing */}
            <PricingBreakdown property={property} />

            {/* Apply CTA */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <Link href={`/properties/${id}/apply`} className="block">
                  <Button size="lg" className="w-full">
                    Apply for This Property
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Phone className="h-4 w-4" />
                    Call Agent
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
                <div className="flex gap-3 pt-1">
                  <button className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    <Heart className="h-4 w-4" />
                    Save
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Safety notice */}
            <div className="rounded-xl border border-[var(--color-emerald)]/20 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-emerald)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Verified Listing
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    This property has been verified by the Renyt team. The agent
                    is ID-verified and approved.
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
