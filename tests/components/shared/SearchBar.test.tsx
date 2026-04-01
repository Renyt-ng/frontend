import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/components/search/SearchBar";

const push = vi.fn();
const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => useSearchParams(),
}));

vi.mock("@/lib/hooks", () => ({
  useLocations: () => ({
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
  }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    push.mockReset();
    useSearchParams.mockReset();
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("does not show location suggestions before typing", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.focus(input);

    expect(screen.queryByText("Eti-Osa LGA")).not.toBeInTheDocument();
  });

  it("shows suggestions after typing and includes the canonical slug in navigation", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search by area in Lagos...");
    fireEvent.change(input, { target: { value: "Eti" } });

    const suggestion = screen.getByText("Eti-Osa LGA");
    expect(suggestion).toBeInTheDocument();

    fireEvent.click(suggestion);

    expect(push).toHaveBeenCalledWith(
      "/search?area=Eti-Osa&location_slug=eti-osa-lga",
    );
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