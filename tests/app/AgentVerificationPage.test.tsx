import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AgentVerificationPage from "@/app/(dashboard)/dashboard/agent-verification/page";
import { useAuthStore } from "@/stores/authStore";

const hooks = vi.hoisted(() => ({
  useAgentVerificationSettings: vi.fn(),
  useCreateAgent: vi.fn(),
  useMyAgent: vi.fn(),
  usePhoneVerificationStatus: vi.fn(),
  useRequestPhoneVerification: vi.fn(),
  useUpdateMyAgentContact: vi.fn(),
  useVerifyPhoneVerification: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AgentVerificationPage", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModalStub(this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function closeStub(this: HTMLDialogElement) {
      this.open = false;
    });

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
    hooks.usePhoneVerificationStatus.mockReturnValue({
      data: {
        data: {
          phone: "+234 800 000 0000",
          verified: false,
          code_sent: false,
          resend_available_at: null,
          expires_at: null,
          locked_until: null,
          verified_at: null,
        },
      },
      isLoading: false,
    });
    hooks.useCreateAgent.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useRequestPhoneVerification.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUpdateMyAgentContact.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useVerifyPhoneVerification.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders the phone and WhatsApp sections before document upload", { timeout: 15000 }, () => {
    render(<AgentVerificationPage />);

    expect(screen.getByRole("heading", { name: /phone verification/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /whatsapp contact/i })).toBeInTheDocument();
    expect(
      screen.getByText(/verify your primary phone to unlock whatsapp contact settings/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /verification documents/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit verification/i })).toBeDisabled();
  });

  it("renders the submitted summary with phone and WhatsApp details", () => {
    hooks.usePhoneVerificationStatus.mockReturnValue({
      data: {
        data: {
          phone: "+234 800 000 0000",
          verified: true,
          code_sent: false,
          resend_available_at: null,
          expires_at: null,
          locked_until: null,
          verified_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    hooks.useMyAgent.mockReturnValue({
      data: {
        data: {
          id: "agent-1",
          user_id: "user-1",
          verification_status: "pending",
          business_name: "Prime Homes",
          business_address: "12 Admiralty Way, Lekki",
          id_document_url: null,
          verification_documents: [],
          phone_verified: true,
          primary_phone: "+234 800 000 0000",
          primary_phone_verified_at: "2026-04-01T00:00:00.000Z",
          whatsapp_phone: "+234 801 111 1111",
          whatsapp_same_as_primary_phone: false,
          approved_by: null,
          approved_at: null,
          created_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentVerificationPage />);

    expect(screen.getByText(/verified primary phone/i)).toBeInTheDocument();
    expect(screen.getByText("+234 800 000 0000")).toBeInTheDocument();
    expect(screen.getByText("+234 801 111 1111")).toBeInTheDocument();
    expect(
      screen.getByText(/whatsapp contact uses \+234 801 111 1111/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update contact numbers/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /phone verification/i })).not.toBeInTheDocument();
  });

  it("opens a shared contact modal for primary phone and whatsapp updates", () => {
    hooks.usePhoneVerificationStatus.mockReturnValue({
      data: {
        data: {
          phone: "+234 800 000 0000",
          verified: true,
          code_sent: false,
          resend_available_at: null,
          expires_at: null,
          locked_until: null,
          verified_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    hooks.useMyAgent.mockReturnValue({
      data: {
        data: {
          id: "agent-1",
          user_id: "user-1",
          verification_status: "approved",
          business_name: "Prime Homes",
          business_address: "12 Admiralty Way, Lekki",
          id_document_url: null,
          verification_documents: [],
          phone_verified: true,
          primary_phone: "+234 800 000 0000",
          primary_phone_verified_at: "2026-04-01T00:00:00.000Z",
          whatsapp_phone: "+234 801 111 1111",
          whatsapp_same_as_primary_phone: false,
          approved_by: null,
          approved_at: null,
          created_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentVerificationPage />);

    fireEvent.click(screen.getByRole("button", { name: /update contact numbers/i }));

    expect(screen.getByRole("dialog", { name: /update contact numbers/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /phone verification/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /whatsapp contact/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save contact settings/i })).toBeInTheDocument();
  });

  it("reopens the form for a rejected verification so the agent can try again", () => {
    hooks.useMyAgent.mockReturnValue({
      data: {
        data: {
          id: "agent-1",
          user_id: "user-1",
          verification_status: "rejected",
          business_name: "Prime Homes",
          business_address: "12 Admiralty Way, Lekki",
          id_document_url: null,
          verification_documents: [],
          phone_verified: true,
          primary_phone: "+234 800 000 0000",
          primary_phone_verified_at: "2026-04-01T00:00:00.000Z",
          whatsapp_phone: "+234 800 000 0000",
          whatsapp_same_as_primary_phone: true,
          approved_by: null,
          approved_at: null,
          created_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    hooks.usePhoneVerificationStatus.mockReturnValue({
      data: {
        data: {
          phone: "+234 800 000 0000",
          verified: true,
          code_sent: false,
          resend_available_at: null,
          expires_at: null,
          locked_until: null,
          verified_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
    });

    render(<AgentVerificationPage />);

    expect(screen.getByRole("heading", { name: /resubmit agent verification/i })).toBeInTheDocument();
    expect(
      screen.getByText(/your previous verification request was rejected\. you can make another attempt from this page\./i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Prime Homes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12 Admiralty Way, Lekki")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit verification/i })).toBeDisabled();
  });

  it("disables send code when the current phone is already verified and unchanged", () => {
    hooks.usePhoneVerificationStatus.mockReturnValue({
      data: {
        data: {
          phone: "+234 800 000 0000",
          verified: true,
          code_sent: false,
          resend_available_at: null,
          expires_at: null,
          locked_until: null,
          verified_at: "2026-04-01T00:00:00.000Z",
        },
      },
      isLoading: false,
    });

    render(<AgentVerificationPage />);

    expect(screen.getByRole("button", { name: /send code/i })).toBeDisabled();
    expect(screen.getByText(/phone verified\./i)).toBeInTheDocument();
  });
});
