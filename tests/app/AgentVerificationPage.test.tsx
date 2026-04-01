import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentVerificationPage from "@/app/(dashboard)/dashboard/agent-verification/page";
import { useAuthStore } from "@/stores/authStore";

const hooks = vi.hoisted(() => ({
  useAgentVerificationSettings: vi.fn(),
  useCreateAgent: vi.fn(),
  useMyAgent: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AgentVerificationPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "agent@example.com",
        full_name: "Agent User",
        phone: "+2348000000000",
        avatar_url: "https://example.com/avatar.jpg",
        avatar_review_status: "approved",
        avatar_review_note: null,
        role: "agent",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    hooks.useMyAgent.mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      error: null,
    });
    hooks.useAgentVerificationSettings.mockReturnValue({
      data: {
        data: {
          id: "settings-1",
          required_document_types: ["government_id"],
          allowed_mime_types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
          max_file_size_mb: 8,
          updated_by: null,
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
    });
    hooks.useCreateAgent.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders the redesigned verification document section without the redundant admin note", () => {
    render(<AgentVerificationPage />);

    expect(screen.getByRole("heading", { name: /verification documents/i })).toBeInTheDocument();
    expect(screen.getByText(/upload clear, readable files for each required document/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 8mb/i)).toBeInTheDocument();
    expect(screen.getByText(/^required$/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/admins will review your encrypted verification uploads/i),
    ).toBeNull();
  });
});
