import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

const { pathnameState, replace, refresh } = vi.hoisted(() => ({
  pathnameState: { current: "/search" },
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => pathnameState.current,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(auth)/login/LoginForm", () => ({
  LoginForm: () => <div>Embedded login</div>,
}));

vi.mock("@/app/(auth)/register/RegisterForm", () => ({
  RegisterForm: () => <div>Embedded register</div>,
}));

describe("AuthOverlay", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModalStub() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function closeStub() {
      this.open = false;
    });

    pathnameState.current = "/search";
    replace.mockReset();
    refresh.mockReset();
    useAuthOverlayStore.setState({
      isOpen: false,
      mode: "login",
      redirectTo: "/",
      resumeAction: null,
      onAuthenticated: null,
      onClose: null,
      restoreFocusTo: null,
    });
  });

  it("closes the overlay when navigating to a dedicated auth page", async () => {
    useAuthOverlayStore.getState().openOverlay({ mode: "login", redirectTo: "/search" });

    const { rerender } = render(<AuthOverlay />);

    expect(screen.getByRole("dialog", { name: /sign in dialog/i })).toBeInTheDocument();

    pathnameState.current = "/forgot-password";
    rerender(<AuthOverlay />);

    await waitFor(() => {
      expect(useAuthOverlayStore.getState().isOpen).toBe(false);
    });

    expect(screen.queryByRole("dialog", { name: /sign in dialog/i })).not.toBeInTheDocument();
  });
});