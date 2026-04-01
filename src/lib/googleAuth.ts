import type { ResumeAction, AuthMode } from "@/lib/authNavigation";

export type GoogleAuthRole = "tenant" | "agent";

interface GoogleOAuthQueryParamsOptions {
  forceAccountSelection?: boolean;
}

function isResumeAction(value: string | null): value is ResumeAction {
  return (
    value === "wishlist" ||
    value === "like" ||
    value === "message" ||
    value === "call"
  );
}

export function sanitizeRedirectTo(redirectTo: string | null | undefined) {
  if (!redirectTo) {
    return "/";
  }

  const destination = new URL(redirectTo, "https://renyt.local");
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function resolvePostAuthDestination(input: {
  redirectTo?: string | null;
  resumeAction?: string | null;
}) {
  const destination = new URL(
    sanitizeRedirectTo(input.redirectTo),
    "https://renyt.local",
  );

  if (isResumeAction(input.resumeAction ?? null)) {
    destination.searchParams.set("resumeAction", input.resumeAction!);
    destination.searchParams.set("resumeAuth", "1");
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function buildGoogleAuthCallbackUrl(input: {
  origin: string;
  mode: AuthMode;
  redirectTo?: string | null;
  resumeAction?: ResumeAction | null;
  role?: GoogleAuthRole;
}) {
  const url = new URL("/auth/callback", input.origin);
  url.searchParams.set("mode", input.mode);
  url.searchParams.set("redirectTo", sanitizeRedirectTo(input.redirectTo));

  if (input.resumeAction) {
    url.searchParams.set("resumeAction", input.resumeAction);
  }

  if (input.role) {
    url.searchParams.set("role", input.role);
  }

  return url.toString();
}

export function buildGoogleOAuthQueryParams(
  options: GoogleOAuthQueryParamsOptions = {},
) {
  return {
    include_granted_scopes: "true",
    ...(options.forceAccountSelection ? { prompt: "select_account" } : {}),
  };
}