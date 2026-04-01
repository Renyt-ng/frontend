import { describe, expect, it } from "vitest";
import {
  buildGoogleAuthCallbackUrl,
  buildGoogleOAuthQueryParams,
  resolvePostAuthDestination,
  sanitizeRedirectTo,
} from "@/lib/googleAuth";

describe("googleAuth", () => {
  it("sanitizes redirect targets to app-local paths", () => {
    expect(sanitizeRedirectTo("https://renyt.ng/search?area=Yaba")).toBe(
      "/search?area=Yaba",
    );
    expect(sanitizeRedirectTo(null)).toBe("/");
  });

  it("builds callback urls that preserve auth continuity", () => {
    expect(
      buildGoogleAuthCallbackUrl({
        origin: "https://renyt.ng",
        mode: "register",
        redirectTo: "/properties/123",
        resumeAction: "wishlist",
        role: "agent",
      }),
    ).toBe(
      "https://renyt.ng/auth/callback?mode=register&redirectTo=%2Fproperties%2F123&resumeAction=wishlist&role=agent",
    );
  });

  it("resolves post-auth destinations with resume markers", () => {
    expect(
      resolvePostAuthDestination({
        redirectTo: "/properties/123",
        resumeAction: "message",
      }),
    ).toBe("/properties/123?resumeAction=message&resumeAuth=1");
  });

  it("builds session-aware google oauth query params by default", () => {
    expect(buildGoogleOAuthQueryParams()).toEqual({
      include_granted_scopes: "true",
    });
  });

  it("supports forcing account selection when explicitly requested", () => {
    expect(buildGoogleOAuthQueryParams({ forceAccountSelection: true })).toEqual({
      include_granted_scopes: "true",
      prompt: "select_account",
    });
  });
});