import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  ArrowRight,
  Building2,
  Search,
  TrendingUp,
  Sparkles,
  CircleStar,
} from "lucide-react";
import { Container } from "@/components/layout";
import { HeroSearchPanel, PopularAreasGrid } from "@/components/search";
import { Button } from "@/components/ui";
import {
  APP_DESCRIPTION,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils";

/* ---------- static data (will be API-driven later) ---------- */

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Verified Experts",
    body: "Every agent is reviewed before they can publish listings, helping discovery feel more trustworthy from the first click.",
    color: "bg-emerald-50 text-[var(--color-emerald)]",
  },
  {
    icon: Eye,
    title: "Clear Listing Intent",
    body: "Browse homes for rent or sale with pricing, status, and listing purpose visible upfront.",
    color: "bg-blue-50 text-[var(--color-deep-slate-blue)]",
  },
  {
    icon: Sparkles,
    title: "Save Your Momentum",
    body: "Shortlist listings, like what stands out, and keep exploring without getting pushed off the page.",
    color: "bg-amber-50 text-amber-600",
  },
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
      <section className="relative z-10 overflow-visible bg-[#0f1720] pb-28 pt-6 sm:pb-40 sm:pt-10">
        <Image
          src="/landing-image.jpg"
          alt="People exploring property options together"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,32,0.48)_0%,rgba(15,23,32,0.62)_28%,rgba(15,23,32,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(15,23,32,0)_0%,rgba(8,12,16,0.2)_18%,rgba(8,12,16,0.58)_48%,rgba(8,12,16,0.78)_68%,rgba(244,245,247,0.96)_92%,rgba(255,255,255,1)_100%)] blur-[10px]" />

        <Container size="md" className="relative">
          <div className="mx-auto max-w-4xl text-center text-white">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
              <CircleStar className="h-4 w-4" />
              Trust-first property discovery for Lagos
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              Housing without the anxiety.
            </h1>

            {/* <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/88 sm:text-lg">
              {APP_DESCRIPTION} Browse rent and sale listings, save what stands out,
              and contact verified experts when you&rsquo;re ready.
            </p> */}
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <HeroSearchPanel />
          </div>

          {/* <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
            <span className="font-medium text-white/70">Trending:</span>
            {PROPERTY_TYPES.slice(0, 4).map((t) => (
              <Link
                key={t.slug}
                href={t.href}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-medium backdrop-blur-sm transition-colors hover:bg-white/16"
              >
                {t.label}
              </Link>
            ))}
          </div> */}
        </Container>
      </section>

      {/* ─── Trust Stats Bar ──────────────────────────────────── */}
      {/* <section className="relative z-0 border-y border-[var(--color-border)] bg-white py-8">
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
      </section> */}

      {/* ─── Why Renyt ────────────────────────────────────────── */}
      {/* <section className="py-16 sm:py-24">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Why Property Seekers &amp; Agents Choose Renyt
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">
              We&rsquo;re making discovery feel clearer, warmer, and more trustworthy
              across the Lagos property journey.
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
      </section> */}

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

          <PopularAreasGrid />
        </Container>
      </section>

      {/* ─── Browse by Property Type ──────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Browse by Property Type
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Explore property formats that match how you want to search.
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
            Ready to Explore Lagos Properties?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-blue-200/80">
            Search verified listings, shortlist what fits, and move from discovery
            to serious intent with less friction.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/search">
              <Button variant="success" size="lg" className="px-8">
                Start Exploring
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
      <section id="how-it-works" className="py-16 sm:py-24 scroll-mt-24">
        <Container size="md">
          <h2 className="text-center text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            How Renyt Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            Discover property opportunities in Lagos with a simpler front door.
          </p>

          <div className="stagger-children mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Search & Discover",
                body: "Browse verified listings across Lagos, then narrow quickly by area, property type, bedrooms, and price.",
                icon: TrendingUp,
              },
              {
                step: "02",
                title: "Save & Shortlist",
                body: "Like or save listings that catch your eye so you can compare options without losing momentum.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Contact Verified Experts",
                body: "When your are ready, continue with the listing that fits and reach the verified expert attached to it.",
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
