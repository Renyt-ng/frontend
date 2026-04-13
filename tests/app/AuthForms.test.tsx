import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/ForgotPasswordForm";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/ResetPasswordForm";

const {
  push,
  refresh,
  resetPasswordForEmail,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUp,
  updateUser,
  requestSignupEmailVerification,
  verifySignupEmailVerification,
  getProfile,
  getSession,
  onAuthStateChange,
  setAuthToken,
} = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
  requestSignupEmailVerification: vi.fn(),
  verifySignupEmailVerification: vi.fn(),
  getProfile: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
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
      resetPasswordForEmail,
      signInWithOAuth,
      signInWithPassword,
      signOut,
      signUp,
      updateUser,
      getSession,
      onAuthStateChange,
    },
  }),
}));

describe("auth forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    signInWithOAuth.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({ error: null, data: {} });
    signOut.mockResolvedValue({ error: null });
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
    updateUser.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    window.history.replaceState({}, "", "/login");
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

  it("sends a password reset email from the forgot password form", async () => {
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith(
        "ada@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        }),
      );
    });

    expect(
      screen.getByText(/we have sent password reset instructions to your inbox/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send again in 1:00/i })).toBeDisabled();
  });

  it("keeps a cooldown between password reset requests", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T10:00:00.000Z"));

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/you can request another reset email in 1:00/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });

    expect(screen.getByRole("button", { name: /send again in 0:29/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /send again in 0:29/i }));
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });

    expect(screen.getByRole("button", { name: /send reset link/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(resetPasswordForEmail).toHaveBeenCalledTimes(2);
  });

  it("updates the password from a valid recovery session and redirects to sign in", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    window.history.replaceState({}, "", "/reset-password#type=recovery&access_token=test-token");

    render(<ResetPasswordForm />);

    await screen.findByLabelText(/^New Password$/i);

    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    });

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith(expect.stringContaining("/login?message="));
      expect(refresh).toHaveBeenCalled();
    });
  });
});