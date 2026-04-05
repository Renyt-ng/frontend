import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeroSearchPanel } from "@/components/search/HeroSearchPanel";

const { push, hooks } = vi.hoisted(() => ({
  push: vi.fn(),
  hooks: {
    useLocations: vi.fn(),
    usePropertyTypes: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("HeroSearchPanel", () => {
  beforeEach(() => {
    push.mockReset();
    hooks.useLocations.mockReset();
    hooks.usePropertyTypes.mockReset();

    hooks.useLocations.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    hooks.usePropertyTypes.mockReturnValue({
      data: {
        data: [
          { slug: "maisonette", label: "Maisonette" },
          { slug: "terrace-duplex", label: "Terrace Duplex" },
        ],
      },
      isLoading: false,
    });
  });

  it("renders property type options from the backend query", () => {
    render(<HeroSearchPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Property Type" }));

    expect(hooks.usePropertyTypes).toHaveBeenCalled();
    expect(screen.getByText("Maisonette")).toBeInTheDocument();
    expect(screen.getByText("Terrace Duplex")).toBeInTheDocument();
  });

  it("submits selected backend property types in the search query", () => {
    render(<HeroSearchPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Property Type" }));
    fireEvent.click(screen.getByText("Terrace Duplex"));
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?listing_purpose=sale&property_type=terrace-duplex");
  });
});