import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyViewTracker } from "@/components/property";

const mutateAsync = vi.fn();

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

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

  it("retries when a stale pending marker already exists", async () => {
    window.sessionStorage.setItem("renyt:property-viewed:property-1", "pending:stale");

    render(<PropertyViewTracker propertyId="property-1" />);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("does not create duplicate writes while a fresh pending attempt exists", async () => {
    const deferred = createDeferred<{ data: { tracked: boolean } }>();
    mutateAsync.mockReturnValueOnce(deferred.promise);

    const view = render(<PropertyViewTracker propertyId="property-1" />);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    view.rerender(<PropertyViewTracker propertyId="property-1" />);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    deferred.resolve({ data: { tracked: true } });

    await waitFor(() => {
      expect(window.sessionStorage.getItem("renyt:property-viewed:property-1")).toBe("tracked");
    });
  });
});