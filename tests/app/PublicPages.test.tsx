import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("public launch pages", () => {
  it("renders the Terms of Service page content", async () => {
    const { default: TermsPage } = await import("@/app/(marketing)/terms/page");
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(/launch terms explain how renyt works/i)).toBeInTheDocument();
  }, 20000);

  it("renders the Privacy Policy page content", async () => {
    const { default: PrivacyPage } = await import("@/app/(marketing)/privacy/page");
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/handles personal data at launch/i)).toBeInTheDocument();
  });

  it("renders the For Agents page content", async () => {
    const { default: AgentsPage } = await import("@/app/(marketing)/agents/page");
    render(<AgentsPage />);

    expect(screen.getByRole("heading", { name: /join a marketplace built around trust/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start verification/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("renders the referral terms page content", async () => {
    const { default: ReferralTermsPage } = await import("@/app/(marketing)/referral-terms/page");
    render(<ReferralTermsPage />);

    expect(screen.getByRole("heading", { name: /refer & earn terms/i })).toBeInTheDocument();
    expect(screen.getByText(/qualified referrals/i)).toBeInTheDocument();
  }, 20000);
});