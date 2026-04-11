import { describe, expect, it } from "vitest";
import {
  buildFallbackProfile,
  hasSupabaseAuthCookies,
  isTransientAuthError,
  isUnauthorizedAuthError,
} from "@/lib/authSession";

describe("authSession", () => {
  it("detects transient timeout-style auth errors", () => {
    expect(
      isTransientAuthError({
        message: "fetch failed",
        cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
      }),
    ).toBe(true);

    expect(
      isTransientAuthError({
        response: { status: 503 },
      }),
    ).toBe(true);
  });

  it("detects unauthorized auth errors", () => {
    expect(isUnauthorizedAuthError({ response: { status: 401 } })).toBe(true);
    expect(isUnauthorizedAuthError({ response: { status: 403 } })).toBe(true);
    expect(isUnauthorizedAuthError({ response: { status: 500 } })).toBe(false);
  });

  it("detects whether Supabase auth cookies exist", () => {
    expect(hasSupabaseAuthCookies([{ name: "sb-project-auth-token.0" }])).toBe(true);
    expect(hasSupabaseAuthCookies([{ name: "theme" }])).toBe(false);
    expect(hasSupabaseAuthCookies(undefined)).toBe(false);
  });

  it("builds a fallback profile from auth metadata", () => {
    expect(
      buildFallbackProfile({
        id: "user-1",
        email: "user@example.com",
        created_at: "2026-03-28T00:00:00.000Z",
        user_metadata: {
          full_name: "James User",
          role: "tenant",
          avatar_url: "https://cdn.renyt.ng/avatar.jpg",
        },
      } as never),
    ).toMatchObject({
      id: "user-1",
      email: "user@example.com",
      full_name: "James User",
      role: "tenant",
      avatar_url: "https://cdn.renyt.ng/avatar.jpg",
    });
  });

  it("falls back to the Google picture when avatar_url is not present", () => {
    expect(
      buildFallbackProfile({
        id: "user-1",
        email: "user@example.com",
        created_at: "2026-03-28T00:00:00.000Z",
        user_metadata: {
          full_name: "James User",
          role: "tenant",
          picture: "https://lh3.googleusercontent.com/avatar.jpg",
        },
      } as never),
    ).toMatchObject({
      avatar_url: "https://lh3.googleusercontent.com/avatar.jpg",
    });
  });

  it("prefers the uploaded profile avatar over Google metadata", () => {
    expect(
      buildFallbackProfile(
        {
          id: "user-1",
          email: "user@example.com",
          created_at: "2026-03-28T00:00:00.000Z",
          user_metadata: {
            full_name: "James User",
            role: "tenant",
            picture: "https://lh3.googleusercontent.com/avatar.jpg",
          },
        } as never,
        {
          id: "user-1",
          email: "user@example.com",
          full_name: "James User",
          phone: null,
          avatar_url: "https://cdn.renyt.ng/uploaded-avatar.jpg",
          avatar_review_status: "pending",
          avatar_review_note: null,
          role: "tenant",
          created_at: "2026-03-28T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      avatar_url: "https://cdn.renyt.ng/uploaded-avatar.jpg",
    });
  });
});