import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentActivationPage from "@/app/(dashboard)/dashboard/agent-activation/page";

const hooks = vi.hoisted(() => ({
  useAdminAgentActivationCandidates: vi.fn(),
  useAdminAgentActivationWorkspace: vi.fn(),
  useUpsertAdminAgentActivation: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("@/lib/profileAvatar", () => ({
  fileToBase64: vi.fn(),
}));

describe("AgentActivationPage", () => {
  beforeEach(() => {
    hooks.useAdminAgentActivationCandidates.mockReturnValue({
      data: {
        data: [
          {
            profile: {
              id: "user-1",
              full_name: "Ada Agent",
              email: "ada@example.com",
              phone: "+2348000000000",
              role: "tenant",
              avatar_url: "https://example.com/avatar.jpg",
              avatar_review_status: "approved",
              is_suspended: false,
            },
            agent: null,
            eligible: true,
            reasons: [],
          },
        ],
      },
    });

    hooks.useAdminAgentActivationWorkspace.mockReturnValue({
      data: {
        data: {
          candidate: {
            profile: {
              id: "user-1",
              full_name: "Ada Agent",
              email: "ada@example.com",
              phone: "+2348000000000",
              role: "tenant",
              avatar_url: "https://example.com/avatar.jpg",
              avatar_review_status: "approved",
              is_suspended: false,
            },
            agent: {
              id: "agent-1",
              user_id: "user-1",
              verification_status: "pending",
              business_name: "Prime Homes",
              business_address: "12 Admiralty Way, Lekki",
              id_document_url: null,
              verification_documents: [
                {
                  document_type: "government_id",
                  file_name: "gov-id.pdf",
                  mime_type: "application/pdf",
                  storage_path: "path/gov-id.pdf",
                  uploaded_at: "2026-04-11T00:00:00.000Z",
                },
              ],
              phone_verified: true,
              primary_phone: "+2348000000000",
              primary_phone_verified_at: "2026-04-11T00:00:00.000Z",
              whatsapp_phone: "+2348000000000",
              whatsapp_same_as_primary_phone: true,
              approved_by: null,
              approved_at: null,
              activation_segment: "admin_assisted_activation",
              activation_assisted_by: "admin-1",
              activation_assisted_at: "2026-04-11T00:00:00.000Z",
              created_at: "2026-04-11T00:00:00.000Z",
            },
            eligible: true,
            reasons: [],
          },
          settings: {
            id: "settings-1",
            required_document_types: ["government_id"],
            allowed_mime_types: ["application/pdf"],
            max_file_size_mb: 8,
            updated_by: null,
            created_at: "2026-04-11T00:00:00.000Z",
            updated_at: "2026-04-11T00:00:00.000Z",
          },
          readiness: {
            profile_photo_ready: true,
            primary_phone_ready: true,
            whatsapp_ready: true,
            business_details_ready: true,
            required_documents_ready: true,
            missing_items: [],
            ready_for_approval: true,
          },
        },
      },
    });

    hooks.useUpsertAdminAgentActivation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders candidate search, workspace fields, and approval action", () => {
    render(<AgentActivationPage />);

    expect(screen.getByRole("heading", { name: /agent activation/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prime Homes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12 Admiralty Way, Lekki")).toBeInTheDocument();
    expect(screen.getByText(/current: gov-id\.pdf/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve agent/i })).toBeEnabled();
  });

  it("shows non-blocking loading placeholders while activation data is loading", () => {
    hooks.useAdminAgentActivationCandidates.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    hooks.useAdminAgentActivationWorkspace.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<AgentActivationPage />);

    expect(screen.getByRole("heading", { name: /agent activation/i })).toBeInTheDocument();
    expect(screen.queryByText(/No matches/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});