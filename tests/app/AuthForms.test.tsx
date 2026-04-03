import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";

const {
  push,
  refresh,
  signInWithOAuth,
  signInWithPassword,
  signUp,
  requestSignupEmailVerification,
  verifySignupEmailVerification,
  getProfile,
  setAuthToken,
} = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  requestSignupEmailVerification: vi.fn(),
  verifySignupEmailVerification: vi.fn(),
  getProfile: vi.fn(),
  setAuthToken: vi.fn(),
}));

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

vi.mock("@/lib/api", () => ({
  setAuthToken,
  authApi: {
    getProfile,
    requestSignupEmailVerification,
    verifySignupEmailVerification,
  },
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithPassword,
      signUp,
    },
  }),
}));

describe("auth forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuth.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({ error: null, data: {} });
    signUp.mockResolvedValue({
      error: null,
      data: {
        session: {
          access_token: "access-token",
        },
        user: {
          id: "user-1",
          email: "ada@example.com",
          created_at: "2026-04-03T00:00:00.000Z",
          user_metadata: {
            full_name: "Ada Agent",
            role: "tenant",
          },
        },
      },
    });
    requestSignupEmailVerification.mockResolvedValue({
      data: {
        email: "ada@example.com",
        code_sent: true,
        verified: false,
        resend_available_at: null,
        expires_at: null,
        locked_until: null,
        verified_at: null,
        development_code: "123456",
      },
    });
    verifySignupEmailVerification.mockResolvedValue({
      data: {
        email: "ada@example.com",
        code_sent: false,
        verified: true,
        resend_available_at: null,
        expires_at: null,
        locked_until: null,
        verified_at: "2026-04-03T00:00:00.000Z",
      },
    });
    getProfile.mockResolvedValue({
      data: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Agent",
        phone: null,
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "tenant",
        created_at: "2026-04-03T00:00:00.000Z",
      },
    });
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

  it("sends a verification code before creating the password account", async () => {
    render(<RegisterForm embedded />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Ada Agent" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(requestSignupEmailVerification).toHaveBeenCalledWith({
        email: "ada@example.com",
      });
    });

    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByText(/development code: 123456/i)).toBeInTheDocument();
  });

  it("creates the account only after the verification code is confirmed", async () => {
    render(<RegisterForm embedded />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Ada Agent" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByRole("heading", { name: /verify your email/i });

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /finish registration/i }));

    await waitFor(() => {
      expect(verifySignupEmailVerification).toHaveBeenCalledWith({
        email: "ada@example.com",
        code: "123456",
      });
    });

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "password123",
        options: {
          data: {
            full_name: "Ada Agent",
            role: "tenant",
          },
        },
      });
    });

    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith("access-token");
      expect(push).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
  });
});