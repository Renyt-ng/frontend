import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  FileSignature,
  ArrowRight,
  Building2,
  Star,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout";
import { SearchBar } from "@/components/search";
import { AreaTags } from "@/components/search";
import { Button } from "@/components/ui";
import {
  APP_TAGLINE,
  APP_DESCRIPTION,
  LAGOS_AREAS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils";

/* ---------- static data (will be API-driven later) ---------- */

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Verified Agents",
    body: "Every agent is ID-verified and admin-approved before they can list a single property.",
    color: "bg-emerald-50 text-[var(--color-emerald)]",
  },
  {
    icon: Eye,
    title: "Transparent Pricing",
    body: "See rent, service charge, caution deposit, and agency fee upfront — zero hidden costs.",
    color: "bg-blue-50 text-[var(--color-deep-slate-blue)]",
  },
  {
    icon: FileSignature,
    title: "Digital Leases",
    body: "Apply online, get approved, and e-sign your lease — all within the Renyt platform.",
    color: "bg-purple-50 text-purple-600",
  },
] as const;

const STATS = [
  { value: "1,200+", label: "Verified Listings" },
  { value: "300+", label: "Trusted Agents" },
  { value: "5,000+", label: "Happy Tenants" },
  { value: "16", label: "Lagos Areas" },
] as const;

const PROPERTY_TYPES = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([slug, label]) => ({
    slug,
    label,
    href: `/search?property_type=${slug}`,
  }),
);

/* ============================================================ */

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f4f8] via-[var(--color-bg)] to-[var(--color-bg)] pb-16 pt-12 sm:pb-24 sm:pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-deep-slate-blue)]/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full bg-[var(--color-emerald)]/5 blur-3xl" />

        <Container size="md" className="relative text-center">
          {/* Pill */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-emerald)]/20 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-[var(--color-emerald)]">
            <Star className="h-3.5 w-3.5" />
            Lagos&rsquo; trust-first rental marketplace
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
            Find Your Perfect Home.{" "}
            <span className="text-[var(--color-deep-slate-blue)]">
              {APP_TAGLINE}.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] sm:text-xl">
            {APP_DESCRIPTION}
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <SearchBar />
          </div>

          {/* Quick property-type links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Popular:</span>
            {PROPERTY_TYPES.slice(0, 4).map((t) => (
              <Link
                key={t.slug}
                href={t.href}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-deep-slate-blue)]/30 hover:text-[var(--color-text-primary)]"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Trust Stats Bar ──────────────────────────────────── */}
      <section className="border-y border-[var(--color-border)] bg-white py-8">
        <Container>
          <div className="stagger-children grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-[var(--color-deep-slate-blue)] sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Why Renyt ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Why Renters &amp; Agents Choose Renyt
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">
              We&rsquo;re solving the trust gap in Lagos rentals — one verified
              listing at a time.
            </p>
          </div>

          <div className="stagger-children mt-12 grid gap-8 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.title}
                  className="group rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${h.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {h.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {h.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ─── Browse by Area ───────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                Explore Lagos Neighbourhoods
              </h2>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                Browse homes in Lagos&rsquo; most popular areas.
              </p>
            </div>
            <Link href="/search">
              <Button variant="secondary" size="sm">
                View All Areas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {LAGOS_AREAS.map((area) => (
              <Link
                key={area}
                href={`/search?area=${encodeURIComponent(area)}`}
                className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition-all hover:border-[var(--color-deep-slate-blue)]/20 hover:bg-white hover:shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-deep-slate-blue)]/5 transition-colors group-hover:bg-[var(--color-deep-slate-blue)]/10">
                  <MapPin className="h-5 w-5 text-[var(--color-deep-slate-blue)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {area}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Browse listings &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Browse by Property Type ──────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Rent by Property Type
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Find the right home for your lifestyle.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PROPERTY_TYPES.map((t) => (
              <Link
                key={t.slug}
                href={t.href}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all hover:border-[var(--color-deep-slate-blue)]/20 hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="h-6 w-6 text-[var(--color-deep-slate-blue)]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-deep-slate-blue)]">
                    {t.label}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    View available {t.label.toLowerCase()}s &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[var(--color-deep-slate-blue)] py-16 sm:py-20">
        <Container size="md" className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Find Your Next Home?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-blue-200/80">
            Join thousands of Lagos renters who&rsquo;ve found their perfect
            home through Renyt&rsquo;s verified marketplace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/search">
              <Button variant="success" size="lg" className="px-8">
                Start Searching
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="secondary"
                size="lg"
                className="border-white/20 bg-white/10 px-8 text-white hover:bg-white/20"
              >
                List Your Property
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container size="md">
          <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            How Renyt Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            Renting in Lagos, simplified in three steps.
          </p>

          <div className="stagger-children mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Search & Discover",
                body: "Browse verified listings across 16+ Lagos areas. Filter by type, price, and bedrooms.",
                icon: TrendingUp,
              },
              {
                step: "02",
                title: "Apply Instantly",
                body: "Found a home? Submit your application with a single click. Agents respond within 48 hours.",
                icon: FileSignature,
              },
              {
                step: "03",
                title: "Sign & Move In",
                body: "E-sign your lease digitally and get your keys. No paper, no stress — just your new home.",
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-deep-slate-blue)]/5">
                    <Icon className="h-7 w-7 text-[var(--color-deep-slate-blue)]" />
                  </div>
                  <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-emerald)]">
                    Step {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
