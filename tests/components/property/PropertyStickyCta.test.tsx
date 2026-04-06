import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyStickyCta } from "@/components/property/PropertyStickyCta";

vi.mock("@/components/property/PropertyActionPanel", () => ({
  PropertyActionPanel: () => <div>Sticky actions</div>,
}));

class MockIntersectionObserver {
  static instance: MockIntersectionObserver | null = null;

  public callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instance = this;
  }

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  emit(isIntersecting: boolean) {
    this.callback(
      [
        {
          isIntersecting,
          target: document.getElementById("site-footer") as Element,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

const property = {
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
  images: [],
  property_images: [],
  property_videos: [],
} as never;

describe("PropertyStickyCta", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver as unknown as typeof IntersectionObserver);
    document.body.innerHTML = '<footer id="site-footer"></footer>';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("stays visible until the footer enters view", () => {
    render(<PropertyStickyCta property={property} />);

    const bar = screen.getByLabelText("Sticky property actions");
    expect(bar).toHaveClass("opacity-100");

    act(() => {
      MockIntersectionObserver.instance?.emit(true);
    });
    expect(bar).toHaveClass("translate-y-full");

    act(() => {
      MockIntersectionObserver.instance?.emit(false);
    });
    expect(bar).toHaveClass("translate-y-0");
  });
});