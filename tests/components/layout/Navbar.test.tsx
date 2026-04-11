import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";
import { useAuthStore } from "@/stores/authStore";

const push = vi.fn();
const refresh = vi.fn();
const logout = vi.fn(async () => undefined);

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams("area=Lekki"),
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/hooks", () => ({
  useLogout: () => logout,
}));

describe("Navbar", () => {
  beforeEach(() => {
    logout.mockClear();
    push.mockReset();
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
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "james@example.com",
        full_name: "James User",
        phone: null,
        role: "tenant",
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        created_at: "2026-03-28T00:00:00.000Z",
        updated_at: "2026-03-28T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it("shows the logged-in account summary and menu actions", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
    expect(screen.getByText("James User")).toBeInTheDocument();
    expect(screen.getByText("james@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /james user/i }));

    expect(screen.getByRole("link", { name: /account/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls logout from the account menu", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: /james user/i }));
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    expect(logout).toHaveBeenCalledOnce();
  });

  it("opens mobile navigation as a side drawer and exposes mobile sign-in when signed out", () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<Navbar />);

    expect(screen.getAllByRole("button", { name: /^Sign In$/i }).length).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));

    const dialog = screen.getByRole("dialog", { name: /navigation menu/i });
    const drawer = dialog.querySelector("#mobile-navigation-drawer");

    expect(drawer).toHaveClass("absolute", "right-0", "top-0", "h-dvh");
    expect(screen.getAllByRole("button", { name: /^Sign In$/i }).length).toBe(3);

    fireEvent.click(within(dialog).getByRole("button", { name: /^Close navigation menu$/i }));

    expect(screen.queryByRole("dialog", { name: /navigation menu/i })).not.toBeInTheDocument();
  });
});