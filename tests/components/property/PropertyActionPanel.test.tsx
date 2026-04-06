import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyActionPanel } from "@/components/property/PropertyActionPanel";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import { useAuthStore } from "@/stores/authStore";
import type { PropertyWithImages } from "@/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/properties/property-1",
  useSearchParams: () => new URLSearchParams("ref=ref123"),
}));

vi.mock("@/components/referrals", () => ({
  ReferralProgramModal: () => null,
  ReferralShareTriggerButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Share"}</button>
  ),
}));

const trackMessageIntent = vi.fn(async () => undefined);

vi.mock("@/lib/hooks", () => ({
  useTrackPropertyMessageIntent: () => ({
    mutateAsync: trackMessageIntent,
  }),
}));

const property: PropertyWithImages = {
  id: "property-1",
  agent_id: "agent-1",
  title: "2 Bedroom Flat",
  description: "Clean apartment",
  area: "Yaba",
  address_line: "12 Herbert Macaulay Way",
  property_type: "flat",
  listing_purpose: "rent",
  bedrooms: 2,
  bathrooms: 2,
  rent_amount: 2500000,
  asking_price: null,
  service_charge: 0,
  caution_deposit: 0,
  agency_fee: 0,
  application_mode: "message_agent",
  is_verified: true,
  verification_status: "approved",
  status: "active",
  availability_confirmed_at: null,
  freshness_state: "fresh",
  last_updated_at: "2026-03-28T00:00:00.000Z",
  created_at: "2026-03-28T00:00:00.000Z",
  images: [
    {
      id: "image-1",
      property_id: "property-1",
      image_url: "https://cdn.renyt.ng/property-1-cover.jpg",
      display_order: 0,
      is_cover: true,
      created_at: "2026-03-28T00:00:00.000Z",
    },
  ],
  property_images: [
    {
      id: "image-1",
      property_id: "property-1",
      image_url: "https://cdn.renyt.ng/property-1-cover.jpg",
      display_order: 0,
      is_cover: true,
      created_at: "2026-03-28T00:00:00.000Z",
    },
  ],
  property_videos: [],
  agent_contact: {
    business_name: "Prime Homes",
    full_name: "Ayo Agent",
    phone: "+234 803 000 0000",
    whatsapp_phone: "+234 805 111 2222",
    avatar_url: null,
  },
};

describe("PropertyActionPanel", () => {
  const popupFocus = vi.fn();
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.localStorage.clear();
    trackMessageIntent.mockClear();
    popupFocus.mockReset();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    useAuthOverlayStore.setState({
      isOpen: false,
      mode: "login",
      redirectTo: "/",
      resumeAction: null,
      onAuthenticated: null,
      onClose: null,
      restoreFocusTo: null,
    });
    openSpy = vi.spyOn(window, "open").mockImplementation(
      () =>
        ({
          focus: popupFocus,
        }) as unknown as Window,
    );
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("opens the auth overlay with a resumable message action for guests", () => {
    render(<PropertyActionPanel property={property} />);

    fireEvent.click(screen.getByRole("button", { name: /message agent/i }));

    expect(useAuthOverlayStore.getState()).toMatchObject({
      isOpen: true,
      mode: "login",
      redirectTo: "/properties/property-1?ref=ref123",
      resumeAction: "message",
    });
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("includes a clean property url in the authenticated WhatsApp CTA", () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "user@example.com",
        full_name: "Test User",
        phone: null,
        role: "tenant",
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        created_at: "2026-03-28T00:00:00.000Z",
        updated_at: "2026-03-28T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(<PropertyActionPanel property={property} />);

    const link = screen.getByRole("link", { name: /message agent/i });
    const callLink = screen.getByRole("link", { name: /call agent/i });
    const href = new URL(link.getAttribute("href") ?? "", "https://renyt.ng");
    const message = href.searchParams.get("text");

    expect(`${href.origin}${href.pathname}`).toBe("https://wa.me/2348051112222");
    expect(callLink.getAttribute("href")).toBe("tel:+234 803 000 0000");
    expect(decodeURIComponent(message ?? "")).toContain(
      "https://renyt.ng/properties/property-1",
    );
    expect(decodeURIComponent(message ?? "")).not.toContain("ref=ref123");
  });

  it("tracks the preserved referral code and opens WhatsApp only after auth completes", async () => {
    render(<PropertyActionPanel property={property} />);

    fireEvent.click(screen.getByRole("button", { name: /message agent/i }));

    await act(async () => {
      useAuthStore.setState({
        user: {
          id: "user-1",
          email: "user@example.com",
          full_name: "Test User",
          phone: null,
          role: "tenant",
          avatar_url: null,
          avatar_review_status: "pending",
          avatar_review_note: null,
          created_at: "2026-03-28T00:00:00.000Z",
          updated_at: "2026-03-28T00:00:00.000Z",
        },
        isAuthenticated: true,
        isLoading: false,
      });
      await useAuthOverlayStore.getState().completeAuthentication();
    });

    expect(trackMessageIntent).toHaveBeenCalledWith({
      propertyId: "property-1",
      data: {
        referral_code: "REF123",
        source_channel: "whatsapp",
      },
    });
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/2348051112222"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(popupFocus).toHaveBeenCalled();
  });

  it("renders the share action on the property detail panel", () => {
    render(<PropertyActionPanel property={property} />);

    expect(screen.getByRole("button", { name: /share and earn/i })).toBeInTheDocument();
  });

  it("renders a compact sticky variant without the share action", () => {
    render(<PropertyActionPanel property={property} variant="sticky" />);

    expect(screen.getByRole("button", { name: /whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /call/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /share and earn/i })).not.toBeInTheDocument();
  });
});