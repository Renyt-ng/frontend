import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAuthDestination } from "@/lib/googleAuth";

function isRole(value: string | null): value is "tenant" | "agent" {
  return value === "tenant" || value === "agent";
}

function deriveFullName(metadata: Record<string, unknown>) {
  if (typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0) {
    return metadata.full_name.trim();
  }

  if (typeof metadata.name === "string" && metadata.name.trim().length > 0) {
    return metadata.name.trim();
  }

  const givenName =
    typeof metadata.given_name === "string" ? metadata.given_name.trim() : "";
  const familyName =
    typeof metadata.family_name === "string" ? metadata.family_name.trim() : "";
  const joined = `${givenName} ${familyName}`.trim();
  return joined.length > 0 ? joined : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const mode = requestUrl.searchParams.get("mode") === "register" ? "register" : "login";
  const redirectTo = requestUrl.searchParams.get("redirectTo");
  const resumeAction = requestUrl.searchParams.get("resumeAction");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const errorCode = requestUrl.searchParams.get("error");

  if (errorDescription || errorCode) {
    const fallback = new URL(`/${mode}`, requestUrl.origin);
    fallback.searchParams.set("error", errorDescription ?? errorCode ?? "Authentication failed");
    fallback.searchParams.set("redirectTo", redirectTo ?? "/");
    if (resumeAction) {
      fallback.searchParams.set("resumeAction", resumeAction);
    }
    return NextResponse.redirect(fallback);
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL(resolvePostAuthDestination({ redirectTo, resumeAction }), requestUrl.origin),
    );
  }

  const supabase = await createClient();
  await supabase.auth.exchangeCodeForSession(code);

  const role = requestUrl.searchParams.get("role");
  const shouldApplyRole = mode === "register" && isRole(role);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const metadata =
      user.user_metadata && typeof user.user_metadata === "object"
        ? (user.user_metadata as Record<string, unknown>)
        : {};
    const fullName = deriveFullName(metadata);

    const profileUpdates: Record<string, unknown> = {};
    if (fullName) {
      profileUpdates.full_name = fullName;
    }
    if (shouldApplyRole) {
      profileUpdates.role = role;
    }

    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
    }

    if (shouldApplyRole || fullName) {
      await supabase.auth.updateUser({
        data: {
          ...metadata,
          ...(fullName ? { full_name: fullName } : {}),
          ...(shouldApplyRole ? { role } : {}),
        },
      });
    }
  }

  return NextResponse.redirect(
    new URL(resolvePostAuthDestination({ redirectTo, resumeAction }), requestUrl.origin),
  );
}