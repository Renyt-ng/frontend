import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(dashboard)/dashboard/settings/page";
import { useAuthStore } from "@/stores/authStore";

const hooks = vi.hoisted(() => ({
  useProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
  useUploadProfileAvatar: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);

vi.mock("@/components/settings/EmailNotificationPreferencesCard", () => ({
  EmailNotificationPreferencesCard: () => <div>Email Preferences Stub</div>,
}));

vi.mock("@/components/profile/ProfileAvatarCropModal", () => ({
  ProfileAvatarCropModal: () => null,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Agent",
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

    hooks.useProfile.mockReturnValue({
      data: {
        data: useAuthStore.getState().user,
      },
    });
    hooks.useUpdateProfile.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    hooks.useUploadProfileAvatar.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("disables save until a profile field changes", () => {
    render(<SettingsPage />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    const fullNameInput = screen.getByDisplayValue("Ada Agent");

    expect(saveButton).toBeDisabled();

    fireEvent.change(fullNameInput, { target: { value: "Ada A." } });
    expect(saveButton).toBeEnabled();

    fireEvent.change(fullNameInput, { target: { value: "Ada Agent" } });
    expect(saveButton).toBeDisabled();
  });

  it("renders phone as read-only and points agents to the verification page for updates", () => {
    render(<SettingsPage />);

    const phoneInput = screen.getByDisplayValue("+2348000000000");

    expect(phoneInput).toHaveAttribute("readonly");
    expect(
      screen.getByRole("link", { name: /agent verification page/i }),
    ).toHaveAttribute("href", "/dashboard/agent-verification");
  });
});
