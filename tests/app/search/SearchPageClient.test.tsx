import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPageClient } from "@/app/(marketing)/search/SearchPageClient";
import { useSearchStore } from "@/stores/searchStore";

const { replace, searchProperties } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchProperties: vi.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  propertiesApi: {
    searchProperties,
  },
}));

vi.mock("@/components/layout", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/search", () => ({
  SearchBar: () => <div data-testid="search-bar" />,
  FilterBar: () => <div data-testid="filter-bar" />,
  AreaTags: () => <div data-testid="area-tags" />,
  IntentToggle: () => <div data-testid="intent-toggle" />,
}));

vi.mock("@/components/property", () => ({
  PropertyGrid: ({ properties }: { properties: Array<{ title: string }> }) => (
    <div data-testid="property-grid">{properties.map((property) => property.title).join(",")}</div>
  ),
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Select: ({ value, onChange }: { value: string; onChange: (event: { target: { value: string } }) => void }) => (
    <select
      aria-label="sort"
      value={value}
      onChange={(event) => onChange({ target: { value: event.target.value } })}
    >
      <option value="created_at:desc">Newest First</option>
    </select>
  ),
}));

describe("SearchPageClient", () => {
  beforeEach(() => {
    replace.mockReset();
    searchProperties.mockReset();
    useSearchStore.getState().resetFilters();
  });

  it("hydrates initial URL filters before the first property fetch", async () => {
    searchProperties.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 24, total: 0 },
    });

    render(
      <SearchPageClient
        initialArea="Lekki"
        initialLocationSlug="lekki-phase-1"
        initialFreshOnly={false}
        initialVerifiedOnly={true}
        initialListingPurpose="sale"
        initialPropertyTypes={[]}
      />,
    );

    await waitFor(() => expect(searchProperties).toHaveBeenCalledTimes(1));

    expect(searchProperties).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        area: "Lekki",
        location_slug: "lekki-phase-1",
        listing_purpose: "sale",
        verified: true,
      }),
    );
  });

  it("ignores stale responses after a newer search completes", async () => {
    const firstRequest = createDeferred<{
      data: Array<{ id: string; title: string }>;
      pagination: { page: number; limit: number; total: number };
    }>();
    const secondRequest = createDeferred<{
      data: Array<{ id: string; title: string }>;
      pagination: { page: number; limit: number; total: number };
    }>();

    searchProperties
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    render(
      <SearchPageClient
        initialArea="Lekki"
        initialLocationSlug="lekki-phase-1"
        initialFreshOnly={false}
        initialVerifiedOnly={false}
        initialListingPurpose="sale"
        initialPropertyTypes={[]}
      />,
    );

    await waitFor(() => expect(searchProperties).toHaveBeenCalledTimes(1));

    act(() => {
      useSearchStore.getState().setLocation("Yaba", "yaba");
    });

    await waitFor(() => expect(searchProperties).toHaveBeenCalledTimes(2));

    await act(async () => {
      secondRequest.resolve({
        data: [{ id: "property-2", title: "Yaba Listing" }],
        pagination: { page: 1, limit: 24, total: 1 },
      });
      await secondRequest.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId("property-grid").textContent).toBe("Yaba Listing");
    });

    await act(async () => {
      firstRequest.resolve({
        data: [{ id: "property-1", title: "Lekki Listing" }],
        pagination: { page: 1, limit: 24, total: 1 },
      });
      await firstRequest.promise;
    });

    expect(screen.getByTestId("property-grid").textContent).toBe("Yaba Listing");
  });
});