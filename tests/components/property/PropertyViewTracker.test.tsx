import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyViewTracker } from "@/components/property";

const mutateAsync = vi.fn();

vi.mock("@/lib/hooks", () => ({
  useTrackPropertyView: () => ({
    mutateAsync,
  }),
}));

describe("PropertyViewTracker", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ data: { tracked: true } });
    window.sessionStorage.clear();
  });

  it("tracks a property view once per browser session", async () => {
    const firstRender = render(<PropertyViewTracker propertyId="property-1" />);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      propertyId: "property-1",
      data: {
        session_id: expect.any(String),
      },
    });

    firstRender.unmount();
    render(<PropertyViewTracker propertyId="property-1" />);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});