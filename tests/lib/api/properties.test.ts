import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();

vi.mock("@/lib/api/client", () => ({
  default: {
    get,
  },
}));

describe("properties api search", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("maps verified search params for the backend", async () => {
    const { mapPropertySearchParams } = await import("@/lib/api/properties");

    expect(
      mapPropertySearchParams({
        area: "Lekki",
        verified: true,
        fresh: true,
        page: 2,
        limit: 24,
      }),
    ).toEqual({
      area: "Lekki",
      location_slug: undefined,
      property_type: undefined,
      listing_purpose: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: undefined,
      fresh: true,
      verified: true,
      page: 2,
      limit: 24,
      sort: undefined,
    });
  });

  it("preserves pagination metadata from property search responses", async () => {
    get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: "property-1",
            title: "2 Bedroom Flat",
            area: "Yaba",
            property_type: "flat",
            listing_purpose: "rent",
            bedrooms: 2,
            bathrooms: 2,
            rent_amount: 2500000,
            asking_price: null,
            is_verified: true,
            images: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 24,
          total: 88,
        },
      },
    });

    const { searchProperties } = await import("@/lib/api/properties");
    const result = await searchProperties({ verified: true, page: 1, limit: 24 });

    expect(get).toHaveBeenCalledWith("/properties", {
      params: expect.objectContaining({ verified: true, page: 1, limit: 24 }),
    });
    expect(result.pagination).toEqual({ page: 1, limit: 24, total: 88 });
    expect(result.data).toHaveLength(1);
  });
});