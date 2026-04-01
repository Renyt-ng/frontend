import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Upload } from "lucide-react";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "For Agents",
  description:
    "Learn how verified agents join Renyt, publish structured listings, and build trust with renters in Lagos.",
};

const steps = [
  {
    title: "Apply with your business details",
    body: "Start with your business information and the launch verification requirements needed for review.",
    icon: Building2,
  },
  {
    title: "Complete verification",
    body: "Submit the required identity materials and complete the phone verification step for approval.",
    icon: Upload,
  },
  {
    title: "Publish structured listings",
    body: "Once approved, create listings with structured pricing, clear media, and freshness updates that build confidence.",
    icon: BadgeCheck,
  },
];

const benefits = [
  "Trust signals that help serious renters move faster",
  "Structured listings with clearer pricing and quality expectations",
  "A marketplace designed for verified discovery instead of noisy classifieds",
  "Referral-aware demand and visibility into listing engagement",
];

export default function AgentsPage() {
  return (
    <div className="bg-[#f6f7f8]">
      <section className="bg-[var(--color-deep-slate-blue)] py-16 text-white sm:py-20">
        <Container size="md">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
              <ShieldCheck className="h-4 w-4" />
              For verified agents in Lagos
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Join a marketplace built around trust, structure, and qualified demand.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-blue-100/90 sm:text-lg">
              Renyt is designed for agents who want clearer listing standards, stronger trust signals,
              and a calmer path from discovery to serious renter contact.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Start verification
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-white/20 bg-white/10 px-8 text-white hover:bg-white/20"
                >
                  See how Renyt works
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8">
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                Why agents join Renyt
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                The launch marketplace favors verified, well-structured listings and clearer renter intent.
                It is designed to help professional agents stand out through quality, not noise.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--color-emerald)]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8">
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                What Renyt expects
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                <p>Minimum listing media quality and structured pricing.</p>
                <p>Truthful business and identity information during verification.</p>
                <p>Availability updates that keep listings fresh and credible.</p>
                <p>Clear, professional communication with renters and applicants.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl">
              How agent verification works
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
              Launch verification is designed to confirm identity, set expectations, and make the marketplace safer for renters.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-3xl border border-[var(--color-border)] bg-[#f6f7f8] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--color-deep-slate-blue)] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--color-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}