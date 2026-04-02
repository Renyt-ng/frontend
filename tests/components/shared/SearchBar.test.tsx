import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/components/search/SearchBar";

const push = vi.fn();
const useSearchParams = vi.fn();
const useLocations = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => useSearchParams(),
}));

vi.mock("@/lib/hooks", () => ({
  useLocations: (...args: unknown[]) => useLocations(...args),
}));

function buildLocationsResult(query?: string) {
  if (!query) {
    return { data: { data: [] }, isLoading: false };
  }

  if (query.toLowerCase().startsWith("eti")) {
    return {
      data: {
        data: [
          {
            id: "loc-1",
            slug: "eti-osa-lga",
            name: "Eti-Osa",
            display_name: "Eti-Osa LGA",
            kind: "lga",
            parent_name: null,
            city: "Lagos",
            state: "Lagos",
            country: "Nigeria",
            aliases: [],
            is_active: true,
            sort_order: 1,
            popularity_rank: 1,
            created_at: "",
            updated_at: "",
          },
        ],
      },
      isLoading: false,
    };
  }

  return { data: { data: [] }, isLoading: false };
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    useSearchParams.mockReset();
    useSearchParams.mockReturnValue(new URLSearchParams());
    useLocations.mockReset();
    useLocations.mockImplementation((params?: { q?: string }) => buildLocationsResult(params?.q));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show location suggestions before typing", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.focus(input);

    expect(screen.queryByText("Eti-Osa LGA")).not.toBeInTheDocument();
  });

  it("debounces location suggestions until the query settles", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.change(input, { target: { value: "Eti" } });

    expect(screen.queryByText("Eti-Osa LGA")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(useLocations).toHaveBeenLastCalledWith(
      { q: "Eti", kind: "all", limit: 8 },
      expect.objectContaining({ enabled: true }),
    );

    expect(screen.getByText("Eti-Osa LGA")).toBeInTheDocument();
  });

  it("shows suggestions after typing and includes the canonical slug in navigation", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.change(input, { target: { value: "Eti" } });

    act(() => {
      vi.advanceTimersByTime(180);
    });

    const suggestion = screen.getByText("Eti-Osa LGA");
    expect(suggestion).toBeInTheDocument();

    fireEvent.click(suggestion);

    expect(push).toHaveBeenCalledWith(
      "/search?area=Eti-Osa&location_slug=eti-osa-lga",
    );
  });

  it("supports immediate local search updates without navigation", () => {
    const onSearch = vi.fn();

    render(<SearchBar navigateOnSearch={false} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.change(input, { target: { value: "Eti" } });

    act(() => {
      vi.advanceTimersByTime(180);
    });

    fireEvent.click(screen.getByText("Eti-Osa LGA"));

    expect(onSearch).toHaveBeenCalledWith({
      area: "Eti-Osa",
      locationSlug: "eti-osa-lga",
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("preserves the active search intent when submitting a new location", () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams("listing_purpose=sale&verified=true"),
    );

    render(<SearchBar defaultArea="Ikoyi" />);

    fireEvent.click(screen.getByRole("button"));

    expect(push).toHaveBeenCalledWith(
      "/search?listing_purpose=sale&verified=true&area=Ikoyi",
    );
  });
});