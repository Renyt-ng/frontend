import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isTransientAuthError } from "@/lib/authSession";

/**
 * Refreshes the Supabase auth session on every request via middleware.
 * Must run before any Server Component reads the session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — IMPORTANT: don't remove this
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      response: supabaseResponse,
      user,
      authError: null as "transient" | "fatal" | null,
    };
  } catch (error) {
    return {
      response: supabaseResponse,
      user: null,
      authError: isTransientAuthError(error) ? "transient" : "fatal",
    };
  }
}
