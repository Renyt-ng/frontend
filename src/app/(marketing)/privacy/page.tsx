import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Understand what personal data Renyt collects, why it is used, and how launch data protection expectations are handled.",
};

const sections = [
  {
    title: "What We Collect",
    body: "Renyt collects the minimum personal data needed to operate the marketplace, including account details, engagement activity, listing and profile information, referral events, and verification data where applicable.",
  },
  {
    title: "Why We Use It",
    body: "We use data to manage accounts, secure the platform, support search and contact workflows, review agent verification, track referrals, and meet legal or operational obligations.",
  },
  {
    title: "Sensitive Verification Data",
    body: "KYC and verification documents are treated as sensitive information. They are encrypted in transit and at rest and are intended to be reviewed only by authorized Renyt personnel who need them for verification and compliance purposes.",
  },
  {
    title: "Sharing and Vendors",
    body: "Renyt does not sell personal data. Information may be processed by infrastructure or authentication providers needed to run the service, and may be disclosed when required by law or to protect the marketplace from abuse.",
  },
  {
    title: "Retention and Rights",
    body: "We retain data only as long as reasonably necessary for operations, security, dispute handling, fraud prevention, and legal obligations. Users may request access, corrections, or deletion subject to applicable requirements.",
  },
  {
    title: "Policy Updates",
    body: "Renyt may update this policy as the product evolves. Material changes should be reflected on this page together with the effective date and last-updated metadata.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container size="md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-deep-slate-blue)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mt-6 border-b border-[var(--color-border)] pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
            This policy explains how Renyt handles personal data at launch, including account,
            marketplace, referral, and verification information.
          </p>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Effective date: March 31, 2026. Last updated: March 31, 2026.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {section.title}
              </h2>
              <p className="text-base leading-7 text-[var(--color-text-secondary)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}