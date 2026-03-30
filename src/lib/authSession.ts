import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

function getNestedValue(source: unknown, path: string[]) {
  let current = source as Record<string, unknown> | undefined;

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined;
    }

    current = current[key] as Record<string, unknown> | undefined;
  }

  return current;
}

function normalizeMessage(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function getErrorStatus(error: unknown) {
  const status = getNestedValue(error, ["response", "status"]);
  return typeof status === "number" ? status : null;
}

function getErrorCode(error: unknown) {
  const directCode = getNestedValue(error, ["code"]);

  if (typeof directCode === "string") {
    return String(directCode).toLowerCase();
  }

  const nestedCode = getNestedValue(error, ["cause", "code"]);
  return typeof nestedCode === "string" ? String(nestedCode).toLowerCase() : "";
}

function getErrorMessages(error: unknown) {
  return [
    normalizeMessage(getNestedValue(error, ["message"])),
    normalizeMessage(getNestedValue(error, ["cause", "message"])),
    normalizeMessage(getNestedValue(error, ["response", "data", "message"])),
    normalizeMessage(getNestedValue(error, ["response", "data", "error", "message"])),
  ].filter(Boolean);
}

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "agent" || value === "tenant";
}

export function isUnauthorizedAuthError(error: unknown) {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
}

export function isTransientAuthError(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 408 || status === 429) {
    return true;
  }

  if (typeof status === "number" && status >= 500) {
    return true;
  }

  const code = getErrorCode(error);
  if (
    code === "econnaborted" ||
    code === "err_network" ||
    code === "und_err_connect_timeout"
  ) {
    return true;
  }

  return getErrorMessages(error).some(
    (message) =>
      message.includes("fetch failed") ||
      message.includes("timeout") ||
      message.includes("network error") ||
      message.includes("connect timeout"),
  );
}

export function buildFallbackProfile(
  authUser: Pick<User, "id" | "email" | "created_at" | "user_metadata">,
  existingProfile?: Profile | null,
): Profile {
  const metadata =
    authUser.user_metadata && typeof authUser.user_metadata === "object"
      ? (authUser.user_metadata as Record<string, unknown>)
      : {};

  const metadataName =
    typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null;
  const metadataRole = isUserRole(metadata.role) ? metadata.role : null;
  const metadataAvatar =
    typeof metadata.avatar_url === "string" && metadata.avatar_url.trim().length > 0
      ? metadata.avatar_url
      : null;

  return {
    id: authUser.id,
    email: authUser.email ?? existingProfile?.email ?? null,
    full_name:
      existingProfile?.full_name ??
      metadataName ??
      authUser.email?.split("@")[0] ??
      "User",
    phone: existingProfile?.phone ?? null,
    avatar_url: existingProfile?.avatar_url ?? metadataAvatar,
    avatar_review_status: existingProfile?.avatar_review_status ?? "pending",
    avatar_review_note: existingProfile?.avatar_review_note ?? null,
    role: existingProfile?.role ?? metadataRole ?? "tenant",
    is_verified: existingProfile?.is_verified,
    is_suspended: existingProfile?.is_suspended,
    suspended_at: existingProfile?.suspended_at,
    email_notification_preferences: existingProfile?.email_notification_preferences,
    created_at: existingProfile?.created_at ?? authUser.created_at,
    updated_at: existingProfile?.updated_at,
  };
}