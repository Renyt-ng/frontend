import type { ReadonlyURLSearchParams } from "next/navigation";

export type AuthMode = "login" | "register";
export type ResumeAction = "wishlist" | "like" | "message" | "call";

interface AuthNavigationOptions {
  redirectTo?: string | null;
  resumeAction?: ResumeAction | null;
}

export interface ResolvedAuthNavigation {
  redirectTo: string;
  resumeAction: ResumeAction | null;
  destination: string;
}

export function buildAuthQuery({
  redirectTo,
  resumeAction,
}: AuthNavigationOptions = {}) {
  const params = new URLSearchParams();

  if (redirectTo) {
    params.set("redirectTo", redirectTo);
  }

  if (resumeAction) {
    params.set("resumeAction", resumeAction);
  }

  return params;
}

export function buildAuthHref(
  mode: AuthMode,
  options: AuthNavigationOptions = {},
) {
  const params = buildAuthQuery(options).toString();

  return `/${mode}${params ? `?${params}` : ""}`;
}

export function buildCurrentUrl(
  pathname: string,
  searchParams?: { toString: () => string } | null,
) {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function extractRedirectTo(
  searchParams:
    | URLSearchParams
    | ReadonlyURLSearchParams
    | { get: (key: string) => string | null },
) {
  return searchParams.get("redirectTo") || searchParams.get("redirect") || "/";
}

function extractResumeAction(
  searchParams:
    | URLSearchParams
    | ReadonlyURLSearchParams
    | { get: (key: string) => string | null },
) {
  const resumeAction = searchParams.get("resumeAction");

  if (
    resumeAction === "wishlist" ||
    resumeAction === "like" ||
    resumeAction === "message" ||
    resumeAction === "call"
  ) {
    return resumeAction;
  }

  return null;
}

export function resolveAuthNavigation(
  searchParams:
    | URLSearchParams
    | ReadonlyURLSearchParams
    | { get: (key: string) => string | null },
) {
  const redirectTo = extractRedirectTo(searchParams);
  const resumeAction = extractResumeAction(searchParams);

  const destination = new URL(redirectTo, "https://renyt.local");

  if (resumeAction) {
    destination.searchParams.set("resumeAction", resumeAction);
    destination.searchParams.set("resumeAuth", "1");
  }

  return {
    redirectTo,
    resumeAction,
    destination: `${destination.pathname}${destination.search}`,
  } satisfies ResolvedAuthNavigation;
}
