import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/StatusBadge";

describe("StatusBadge", () => {
  it("renders property statuses", () => {
    const { rerender } = render(<StatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeTruthy();

    rerender(<StatusBadge status="archived" />);
    expect(screen.getByText("Archived")).toBeTruthy();

    rerender(<StatusBadge status="rented" />);
    expect(screen.getByText("Rented")).toBeTruthy();
  });

  it("renders application statuses", () => {
    const { rerender } = render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeTruthy();

    rerender(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeTruthy();

    rerender(<StatusBadge status="rejected" />);
    expect(screen.getByText("Rejected")).toBeTruthy();
  });

  it("renders lease statuses", () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeTruthy();

    rerender(<StatusBadge status="sent" />);
    expect(screen.getByText("Sent")).toBeTruthy();

    rerender(<StatusBadge status="signed" />);
    expect(screen.getByText("Signed")).toBeTruthy();
  });

  it("handles unknown status gracefully", () => {
    render(<StatusBadge status={"unknown" as any} />);
    expect(screen.getByText("unknown")).toBeTruthy();
  });
});
