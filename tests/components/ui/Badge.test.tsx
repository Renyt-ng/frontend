import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders with children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("renders different variants", () => {
    const { rerender } = render(<Badge variant="verified">Verified</Badge>);
    expect(screen.getByText("Verified").className).toContain("bg-");

    rerender(<Badge variant="pending">Pending</Badge>);
    expect(screen.getByText("Pending").className).toContain("bg-");

    rerender(<Badge variant="rejected">Rejected</Badge>);
    expect(screen.getByText("Rejected").className).toContain("bg-");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText("Small").className).toContain("text-");

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText("Large").className).toContain("text-");
  });
});
