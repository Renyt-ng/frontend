import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";

const push = vi.fn();
const refresh = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  }),
}));

describe("auth forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders a visible Google sign-in action on the login form", async () => {
    render(<LoginForm embedded />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining("/auth/callback?mode=login"),
            queryParams: {
              include_granted_scopes: "true",
            },
          }),
        }),
      );
    });
  });

  it("passes the selected role into Google sign-up callbacks", async () => {
    render(<RegisterForm embedded />);

    fireEvent.click(screen.getByLabelText(/list properties/i));
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining("role=agent"),
            queryParams: {
              include_granted_scopes: "true",
            },
          }),
        }),
      );
    });
  });
});