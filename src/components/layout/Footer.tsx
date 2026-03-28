"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { useLocations } from "@/lib/hooks";
import { APP_NAME } from "@/lib/utils";

const BASE_FOOTER_SECTIONS = [
  {
    title: "Renyt",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/how-it-works", label: "How it Works" },
      { href: "/agents", label: "For Agents" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Browse by Type",
    links: [
      { href: "/search?property_type=apartment", label: "Apartments" },
      { href: "/search?property_type=duplex", label: "Duplexes" },
      { href: "/search?property_type=flat", label: "Flats" },
      { href: "/search?property_type=selfcontain", label: "Self Contain" },
      { href: "/search?property_type=bungalow", label: "Bungalows" },
      { href: "/search?property_type=penthouse", label: "Penthouses" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQs" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  const locationsQuery = useLocations({ kind: "area", limit: 8 });
  const popularAreas = locationsQuery.data?.data ?? [];
  const footerSections = [
    ...BASE_FOOTER_SECTIONS.slice(0, 2),
    {
      title: "Popular Areas",
      links: popularAreas.map((area) => ({
        href: `/search?area=${encodeURIComponent(area.name)}`,
        label: area.name,
      })),
    },
    ...BASE_FOOTER_SECTIONS.slice(2),
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <Container>
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-deep-slate-blue)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] py-6 sm:flex-row">
          <div className="flex items-center gap-1">
            <Image
              src="/logo-primary.png"
              alt={APP_NAME}
              width={90}
              height={30}
              className="h-auto w-[68px]"
              unoptimized
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            &copy; {new Date().getFullYear()} {APP_NAME}.ng &mdash; Trust-first
            property discovery in Lagos, Nigeria.
          </p>
        </div>
      </Container>
    </footer>
  );
}
