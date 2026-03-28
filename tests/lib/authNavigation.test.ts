import { describe, expect, it } from "vitest";
import {
  buildAuthHref,
  buildCurrentUrl,
  resolveAuthNavigation,
} from "@/lib/authNavigation";

describe("authNavigation", () => {
  it("builds auth hrefs with redirect and resume action", () => {
    expect(
      buildAuthHref("login", {
        redirectTo: "/search?area=Lekki",
        resumeAction: "wishlist",
      }),
    ).toBe("/login?redirectTo=%2Fsearch%3Farea%3DLekki&resumeAction=wishlist");
  });

  it("builds the current url including query params", () => {
    const searchParams = new URLSearchParams({ area: "Yaba", sort: "newest" });

    expect(buildCurrentUrl("/search", searchParams)).toBe(
      "/search?area=Yaba&sort=newest",
    );
  });

  it("resolves redirectTo and resume action into a destination", () => {
    const searchParams = new URLSearchParams({
      redirectTo: "/properties/123",
      resumeAction: "like",
    });

    expect(resolveAuthNavigation(searchParams)).toEqual({
      redirectTo: "/properties/123",
      resumeAction: "like",
      destination: "/properties/123?resumeAction=like&resumeAuth=1",
    });
  });

  it("supports legacy redirect params and defaults to root", () => {
    expect(
      resolveAuthNavigation(new URLSearchParams({ redirect: "/dashboard" })),
    ).toEqual({
      redirectTo: "/dashboard",
      resumeAction: null,
      destination: "/dashboard",
    });

    expect(resolveAuthNavigation(new URLSearchParams())).toEqual({
      redirectTo: "/",
      resumeAction: null,
      destination: "/",
    });
  });
});