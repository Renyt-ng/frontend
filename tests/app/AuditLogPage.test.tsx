import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuditLogPage from "@/app/(dashboard)/dashboard/audit-log/page";

const hooks = vi.hoisted(() => ({
  useAdminAuditLogs: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

describe("AuditLogPage", () => {
  beforeEach(() => {
    hooks.useAdminAuditLogs.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
  });

  it("shows row placeholders while audit entries are loading", () => {
    const { container } = render(<AuditLogPage />);

    expect(screen.getByRole("heading", { name: /audit log/i })).toBeInTheDocument();
    expect(screen.queryByText(/No Audit Entries/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});