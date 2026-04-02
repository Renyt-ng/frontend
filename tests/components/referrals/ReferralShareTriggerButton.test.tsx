import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferralShareTriggerButton } from "@/components/referrals";
import { useAuthStore } from "@/stores/authStore";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

const useMyAgent = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/properties",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/hooks", () => ({
  useMyAgent: (...args: unknown[]) => useMyAgent(...args),
}));

vi.mock("@/components/referrals/ReferralProgramModal", () => ({
  ReferralProgramModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="referral-modal" /> : null,
}));

const property = {
  id: "property-1",
  agent_id: "agent-1",
  title: "Urban Modern Studio",
  area: "Victoria Island",
  property_type: "self_contain",
  is_verified: true,
};

describe("ReferralShareTriggerButton", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    useMyAgent.mockReset();
    useMyAgent.mockReturnValue({ data: { data: { id: "agent-1" } } });
    useAuthOverlayStore.setState({
      isOpen: false,
      mode: "login",
      redirectTo: "/",
      resumeAction: null,
      onAuthenticated: null,
      onClose: null,
      restoreFocusTo: null,
    });
  });

  it("uses direct sharing for an agent's own property", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: share,
    });

    useAuthStore.setState({
      user: {
        id: "agent-1",
        email: "agent@example.com",
        full_name: "Agent User",
        phone: null,
        role: "agent",
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        created_at: "2026-04-02T00:00:00.000Z",
        updated_at: "2026-04-02T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<ReferralShareTriggerButton property={property} label="Share" />);

    fireEvent.click(screen.getByRole("button", { name: /share/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: "Urban Modern Studio",
        text: "Urban Modern Studio in Victoria Island on Renyt",
        url: "https://renyt.ng/properties/property-1",
      });
    });

    expect(screen.queryByTestId("referral-modal")).not.toBeInTheDocument();
  });

  it("opens the referral modal for a non-owned property", () => {
    useMyAgent.mockReturnValue({ data: { data: { id: "agent-99" } } });

    useAuthStore.setState({
      user: {
        id: "tenant-1",
        email: "tenant@example.com",
        full_name: "Tenant User",
        phone: null,
        role: "tenant",
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        created_at: "2026-04-02T00:00:00.000Z",
        updated_at: "2026-04-02T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<ReferralShareTriggerButton property={property} label="Share" />);

    fireEvent.click(screen.getByRole("button", { name: /share/i }));

    expect(screen.getByTestId("referral-modal")).toBeInTheDocument();
  });
});