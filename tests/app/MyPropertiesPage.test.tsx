import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import MyPropertiesPage from "@/app/(dashboard)/dashboard/properties/page";

const state = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  realtimeCallback: null as null | (() => void),
  router: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  },
  updatePropertyMutateAsync: vi.fn(),
  hooks: {
    useMyAgent: vi.fn(),
    useMyPropertyInsights: vi.fn(),
    useMyProperties: vi.fn(),
    usePropertyOutcomeCandidates: vi.fn(),
    useConfirmPropertyAvailability: vi.fn(),
    useUpdateProperty: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => state.router,
  usePathname: () => "/dashboard/properties",
  useSearchParams: () => state.searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/referrals", () => ({
  ReferralShareTriggerButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Share"}</button>
  ),
}));

vi.mock("@/lib/hooks", () => state.hooks);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: (_type: string, _config: unknown, callback: () => void) => {
        state.realtimeCallback = callback;
        return {
          subscribe: () => ({
            unsubscribe: vi.fn(),
          }),
        };
      },
    }),
  }),
}));

const baseProperty = {
  id: "property-1",
  agent_id: "agent-1",
  title: "Urban Modern Studio",
  description: "A modern listing in Victoria Island.",
  area: "Victoria Island",
  address_line: "1 Example Street",
  property_type: "self_contain",
  listing_purpose: "rent",
  bedrooms: 1,
  bathrooms: 1,
  rent_amount: 72000000,
  asking_price: null,
  service_charge: null,
  caution_deposit: null,
  agency_fee: null,
  application_mode: "message_agent",
  status: "active",
  verification_status: "approved",
  is_verified: true,
  publish_error: null,
  last_status_change_at: null,
  last_published_at: "2026-03-30T09:00:00.000Z",
  availability_confirmed_at: "2026-03-30T09:00:00.000Z",
  last_updated_at: "2026-03-30T09:00:00.000Z",
  created_at: "2026-03-29T09:00:00.000Z",
  updated_at: "2026-03-30T09:00:00.000Z",
  ready_to_publish: true,
  publish_blockers: [],
  images: [
    {
      id: "image-1",
      image_url: "https://example.com/image.jpg",
      is_cover: true,
    },
  ],
};

describe("MyPropertiesPage", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.open = false;
    });
    state.searchParams = new URLSearchParams();
    state.realtimeCallback = null;
    state.router.replace.mockReset();
    state.router.push.mockReset();
    state.router.refresh.mockReset();
    state.updatePropertyMutateAsync.mockReset();
    window.sessionStorage.clear();

    state.hooks.useMyAgent.mockReturnValue({
      data: {
        data: {
          id: "agent-1",
        },
      },
    });
    const refetch = vi.fn();
    state.hooks.useMyProperties.mockReturnValue({
      data: { data: [baseProperty] },
      isLoading: false,
      refetch,
    });
    state.hooks.useMyPropertyInsights.mockReturnValue({
      data: {
        data: [
          {
            property_id: "property-1",
            property_title: "Urban Modern Studio",
            property_area: "Victoria Island",
            property_status: "active",
            property_is_verified: true,
            view_count: 12,
            share_count: 4,
            cta_attempt_count: 3,
            wishlist_count: 2,
            like_count: 1,
            qualified_referrals: 1,
            open_referral_count: 1,
            under_review_count: 0,
            confirmed_count: 0,
            paid_count: 0,
            ineligible_count: 0,
            candidate_count: 2,
            latest_contact_at: "2026-03-30T09:00:00.000Z",
            resolution_summary: null,
          },
        ],
      },
      isLoading: false,
    });
    state.hooks.usePropertyOutcomeCandidates.mockReturnValue({
      data: {
        data: [
          {
            user_id: "user-2",
            full_name: "Matched User",
            email: "matched@example.com",
            phone: "08031111111",
            latest_contact_at: "2026-03-30T09:00:00.000Z",
            source_channels: ["whatsapp"],
            inquiry_count: 1,
            has_open_referral_candidate: true,
            referral_event_id: "event-1",
            referral_status: "potential",
            referrer_user_id: "user-3",
            referrer_name: "Ada",
            referrer_email: "ada@example.com",
            referrer_phone: "08030000000",
          },
        ],
      },
      isLoading: false,
    });
    state.hooks.useConfirmPropertyAvailability.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    state.hooks.useUpdateProperty.mockReturnValue({
      mutateAsync: state.updatePropertyMutateAsync.mockResolvedValue({
        data: {
          ...baseProperty,
          referral_resolution_summary: {
            winning_referral_event_id: "event-1",
            winner_moved_to_under_review: 1,
            open_events_marked_ineligible: 2,
            preserved_terminal_events: 0,
            ineligible_reason: "non_winning_contact",
          },
        },
      }),
      isPending: false,
    });
  });

  it("renders listing health as a bar chart summary", () => {
    render(<MyPropertiesPage />);

    expect(screen.getByText(/Health volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Property insight/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Listing health volume/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Publishing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
  }, 15000);

  it("requires matched-account selection before confirming a Renyt close", async () => {
    render(<MyPropertiesPage />);

    fireEvent.click(screen.getByRole("button", { name: /Mark rented via Renyt/i }));

    expect(screen.getByText(/Select the matched buyer or renter/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Matched User/i));
    fireEvent.click(screen.getByRole("button", { name: /Confirm outcome/i }));

    await waitFor(() => {
      expect(state.updatePropertyMutateAsync).toHaveBeenCalledWith({
        id: "property-1",
        data: {
          status: "rented_renyt",
          matched_user_id: "user-2",
        },
      });
    });
  }, 15000);

  it("requires confirmation before applying an off-platform outcome", async () => {
    render(<MyPropertiesPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mark rented off-platform/i }));
    });

    expect(screen.getByText(/Use this only when the property was rented outside Renyt/i)).toBeInTheDocument();
    expect(state.updatePropertyMutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Confirm off-platform rent/i }));
    });

    await waitFor(() => {
      expect(state.updatePropertyMutateAsync).toHaveBeenCalledWith({
        id: "property-1",
        data: {
          status: "rented_off_platform",
        },
      });
    });
  }, 15000);

  it("cleans the publishing query param after the tracked property becomes active", async () => {
    state.searchParams = new URLSearchParams("publishing=property-1");

    render(<MyPropertiesPage />);

    expect(screen.getByText(/Your property is now live/i)).toBeInTheDocument();
    expect(screen.queryByText(/Publishing in progress/i)).toBeNull();

    await waitFor(() => {
      expect(state.router.replace).toHaveBeenCalledWith("/dashboard/properties");
    });
  });

  it("refetches properties when a realtime property update arrives for the agent", async () => {
    const refetch = vi.fn();
    state.hooks.useMyProperties.mockReturnValue({
      data: { data: [baseProperty] },
      isLoading: false,
      refetch,
    });

    render(<MyPropertiesPage />);

    expect(state.realtimeCallback).not.toBeNull();

    state.realtimeCallback?.();

    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  it("dismisses the publish success banner for the current session", async () => {
    state.searchParams = new URLSearchParams("publishing=property-1");

    const firstRender = render(<MyPropertiesPage />);

    fireEvent.click(screen.getByRole("button", { name: /Dismiss publish success/i }));

    expect(screen.queryByText(/Your property is now live/i)).toBeNull();
    expect(window.sessionStorage.getItem("renyt:dismissed-publish-success")).toContain("property-1");

    firstRender.unmount();

    render(<MyPropertiesPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Your property is now live/i)).toBeNull();
    });
  }, 15000);
});