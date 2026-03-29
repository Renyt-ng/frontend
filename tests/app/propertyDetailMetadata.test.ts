import { beforeEach, describe, expect, it, vi } from "vitest";

const getProperty = vi.fn();

vi.mock("@/lib/api", () => ({
  propertiesApi: {
    getProperty,
  },
}));

describe("property detail metadata", () => {
  beforeEach(() => {
    getProperty.mockReset();
  });

  it("uses the property image and canonical url for share previews", async () => {
    getProperty.mockResolvedValue({
      data: {
        id: "property-1",
        title: "2 Bedroom Flat",
        area: "Yaba",
        property_type: "flat",
        listing_purpose: "rent",
        bedrooms: 2,
        bathrooms: 2,
        rent_amount: 2500000,
        asking_price: null,
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
      },
    });

    const { generateMetadata } = await import(
      "@/app/(marketing)/properties/[id]/page"
    );
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "property-1" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://renyt.ng/properties/property-1",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://cdn.renyt.ng/property-1-cover.jpg",
        alt: "2 Bedroom Flat",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "https://cdn.renyt.ng/property-1-cover.jpg",
    ]);
  }, 15000);
});