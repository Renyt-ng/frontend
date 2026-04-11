import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingHealthPage from "@/app/(dashboard)/dashboard/listing-health/page";

const hooks = vi.hoisted(() => ({
  useAdminAgents: vi.fn(),
  useAdminProperties: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ListingHealthPage", () => {
  beforeEach(() => {
    hooks.useAdminAgents.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    hooks.useAdminProperties.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
  });

  it("shows non-blocking loading placeholders while admin listing data resolves", () => {
    const { container } = render(<ListingHealthPage />);

    expect(screen.getByRole("heading", { name: /listing health/i })).toBeInTheDocument();
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
    expect(screen.queryByText(/No needs confirmation/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});