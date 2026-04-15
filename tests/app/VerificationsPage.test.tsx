import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import VerificationsPage from "@/app/(dashboard)/dashboard/verifications/page";

const hooks = vi.hoisted(() => ({
  useAdminAgents: vi.fn(),
  useAdminAgentVerificationSettings: vi.fn(),
  useAdminProperties: vi.fn(),
  useUpdateAdminAgentVerificationSettings: vi.fn(),
  useUpdateAgentStatus: vi.fn(),
  useVerifyProperty: vi.fn(),
}));

const navigation = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.useSearchParams(),
}));

describe("VerificationsPage", () => {
  beforeEach(() => {
    navigation.useSearchParams.mockReturnValue(new URLSearchParams());
    hooks.useAdminAgents.mockReturnValue({
      data: {
        data: [
          {
            id: "agent-1",
            business_name: "Harbourline Homes",
            business_address: "Ikeja, Lagos",
            verification_status: "pending",
            verification_documents: [],
            created_at: "2026-04-12T00:00:00.000Z",
          },
        ],
      },
      isError: false,
    });
    hooks.useAdminAgentVerificationSettings.mockReturnValue({
      data: {
        data: {
          required_document_types: ["government_id"],
        },
      },
    });
    hooks.useAdminProperties.mockReturnValue({
      data: {
        data: [
          {
            id: "property-1",
            title: "Waterfront Maisonette",
            area: "Lekki Phase 1",
            property_type: "duplex",
            listing_purpose: "rent",
            rent_amount: 12500000,
            asking_price: null,
            status: "active",
            verification_status: "pending",
            application_mode: "message_agent",
          },
          {
            id: "property-2",
            title: "Archived Listing",
            area: "Yaba",
            property_type: "apartment",
            listing_purpose: "rent",
            rent_amount: 3200000,
            asking_price: null,
            status: "archived",
            verification_status: "pending",
            application_mode: "message_agent",
          },
        ],
      },
      isError: false,
    });
    hooks.useUpdateAdminAgentVerificationSettings.mockReturnValue({ mutateAsync: vi.fn() });
    hooks.useUpdateAgentStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useVerifyProperty.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("opens the property queue directly from the tab query param", () => {
    navigation.useSearchParams.mockReturnValue(new URLSearchParams("tab=properties"));

    render(<VerificationsPage />);

    expect(hooks.useAdminProperties).toHaveBeenCalledWith({ status: "active" });
    expect(screen.getByRole("heading", { name: /waterfront maisonette/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /archived listing/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /agent verification requirements/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view listing/i })).toHaveAttribute(
      "href",
      "/properties/property-1",
    );
  }, 15000);

  it("lets admins switch to the property verification tab manually", () => {
    render(<VerificationsPage />);

    fireEvent.click(screen.getByRole("button", { name: /property verifications/i }));

    expect(screen.getByRole("heading", { name: /waterfront maisonette/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve listing/i })).toBeInTheDocument();
  }, 15000);
});