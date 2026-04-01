import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout";

export const metadata: Metadata = {
  title: "Refer & Earn Terms | Renyt",
  description:
    "Launch-ready terms for Renyt's referral program, including eligibility, attribution, and payout rules.",
};

const sections = [
  {
    title: "Eligibility",
    body:
      "Referral participation is available to approved users with an active Renyt account. Admins may pause, limit, or remove access where abuse, duplicate accounts, or policy violations are detected.",
  },
  {
    title: "Qualified referrals",
    body:
      "A referral only qualifies when Renyt can attribute the action to your referral code and the resulting marketplace activity matches the active campaign and program rules in effect at the time of the event.",
  },
  {
    title: "Payout logic",
    body:
      "Estimated earnings shown in-product are previews. Final payout eligibility, close status, and amounts are confirmed by Renyt after workflow review, fraud checks, and close verification.",
  },
  {
    title: "Abuse and reversals",
    body:
      "Self-referrals, spam, misleading promotion, duplicate lead creation, or manipulated listing-close claims may be rejected or reversed. Renyt may hold or deny payout where abuse or incomplete evidence is detected.",
  },
];

export default function ReferralTermsPage() {
  return (
    <div className="bg-[#f6f7f8] py-16 sm:py-20">
      <Container size="md">
        <div className="space-y-6 rounded-[32px] border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-deep-slate-blue)]/70">
              Renyt referral policy
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              Refer &amp; Earn Terms
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
              These launch terms explain how referral participation, qualification, and payout review work on Renyt. They should be read alongside our <Link href="/terms" className="text-[var(--color-deep-slate-blue)] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[var(--color-deep-slate-blue)] hover:underline">Privacy Policy</Link>.
            </p>
          </div>

          <div className="grid gap-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-3xl border border-[var(--color-border)] bg-[#fbfbfb] p-5"
              >
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}