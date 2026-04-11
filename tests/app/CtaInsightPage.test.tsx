import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CtaInsightPage from "@/app/(dashboard)/dashboard/cta-insight/page";

const hooks = vi.hoisted(() => ({
  useAdminAgents: vi.fn(),
  useAdminCtaInsights: vi.fn(),
  useAdminProperties: vi.fn(),
}));

const navigation = vi.hoisted(() => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.useSearchParams(),
}));

describe("CtaInsightPage", () => {
  beforeEach(() => {
    navigation.useSearchParams.mockReturnValue(new URLSearchParams());
    hooks.useAdminAgents.mockReturnValue({ data: undefined, isLoading: true });
    hooks.useAdminProperties.mockReturnValue({ data: undefined, isLoading: true });
    hooks.useAdminCtaInsights.mockReturnValue({ data: undefined, isLoading: true });
  });

  it("keeps the CTA page visible with loading sections instead of an empty state", () => {
    render(<CtaInsightPage />);

    expect(screen.getByRole("heading", { name: /cta insight/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Loading events/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No CTA events/i)).not.toBeInTheDocument();
  });
});