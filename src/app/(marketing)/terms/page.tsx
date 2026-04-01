import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review Renyt's launch terms of service, account responsibilities, marketplace rules, and moderation policies.",
};

const sections = [
  {
    title: "Who We Are",
    body: "Renyt is a trust-first rental marketplace that helps people discover structured listings in Lagos and contact verified agents. Renyt is not a landlord, payment processor, or guarantor of every transaction outcome.",
  },
  {
    title: "Using Renyt",
    body: "By using Renyt, you agree to provide accurate information, use the platform lawfully, and avoid conduct that is misleading, abusive, fraudulent, or designed to manipulate listings, search, incentives, or verification outcomes.",
  },
  {
    title: "Accounts and Identity",
    body: "You are responsible for maintaining the security of your account and any identity provider you choose to use for sign-in. Renyt may restrict, suspend, or terminate access when we detect misuse, policy violations, or safety concerns.",
  },
  {
    title: "Listing and Agent Standards",
    body: "Agents must submit truthful business and verification information, maintain accurate listing details, and comply with Renyt's structured listing standards. Verification badges and freshness indicators are trust signals, not unconditional guarantees.",
  },
  {
    title: "Contact, Referrals, and Platform Conduct",
    body: "Messaging, calls, and referrals must be used in good faith. Referral participation remains subject to separate Refer and Earn terms. Renyt may reject or reverse activity linked to spam, self-referral, fake accounts, or abuse.",
  },
  {
    title: "Service Limits and Updates",
    body: "Renyt may update features, rules, or policies as the product evolves. We will provide notice where required. To the extent allowed by law, Renyt limits liability for indirect losses and does not guarantee uninterrupted service or transaction outcomes.",
  },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
            These launch terms explain how Renyt works, what we expect from users and agents,
            and how we protect the marketplace against misuse.
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