import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthCookies } from "@/lib/authSession";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js middleware:
 *  1. Refreshes the Supabase auth session on every request.
 *  2. Protects /dashboard routes — redirects unauthenticated users to /login.
 */
export async function proxy(request: NextRequest) {
  // Refresh auth session (sets/updates cookies)
  const { response, user, authError } = await updateSession(request);

  const hasSupabaseCookies = hasSupabaseAuthCookies(request.cookies?.getAll?.() ?? []);

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      if (authError === "transient" && hasSupabaseCookies) {
        return response;
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "redirectTo",
        `${request.nextUrl.pathname}${request.nextUrl.search ?? ""}`,
      );
      const redirectResponse = NextResponse.redirect(loginUrl);

      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml (static files)
     * - API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};
