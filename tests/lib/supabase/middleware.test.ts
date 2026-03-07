import { beforeEach, describe, expect, it, vi } from "vitest";

const { nextMock, redirectMock, updateSessionMock } = vi.hoisted(() => ({
  nextMock: vi.fn(() => new MockResponse("next")),
  redirectMock: vi.fn(
    (url: URL | string) => new MockResponse("redirect", url.toString()),
  ),
  updateSessionMock: vi.fn(),
}));

class MockResponse {
  readonly kind: "next" | "redirect";
  readonly location?: string;
  readonly cookies = {
    values: [] as Array<{ name: string; value: string; options?: unknown }>,
    getAll: () => this.cookies.values,
    set: (name: string, value: string, options?: unknown) => {
      this.cookies.values.push({ name, value, options });
    },
  };

  constructor(kind: "next" | "redirect", location?: string) {
    this.kind = kind;
    this.location = location;
  }
}

vi.mock("next/server", () => ({
  NextResponse: {
    next: nextMock,
    redirect: redirectMock,
  },
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: updateSessionMock,
}));

import { middleware } from "@/middleware";

describe("frontend middleware auth protection", () => {
  beforeEach(() => {
    nextMock.mockClear();
    redirectMock.mockClear();
    updateSessionMock.mockReset();
  });

  it("redirects unauthenticated dashboard requests to login", async () => {
    const response = new MockResponse("next");
    response.cookies.set("sb-project-auth-token.0", "chunked-cookie");

    updateSessionMock.mockResolvedValue({
      response,
      user: null,
    });

    const result = await middleware({
      nextUrl: { pathname: "/dashboard" },
      url: "https://renyt.ng/dashboard",
    } as never);

    expect(redirectMock).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      kind: "redirect",
      location: "https://renyt.ng/login?redirect=%2Fdashboard",
    });
    expect(result.cookies.getAll()).toEqual([
      {
        name: "sb-project-auth-token.0",
        value: "chunked-cookie",
        options: { name: "sb-project-auth-token.0", value: "chunked-cookie" },
      },
    ]);
  });

  it("allows authenticated dashboard requests through", async () => {
    const response = new MockResponse("next");

    updateSessionMock.mockResolvedValue({
      response,
      user: { id: "user-1" },
    });

    const result = await middleware({
      nextUrl: { pathname: "/dashboard/settings" },
      url: "https://renyt.ng/dashboard/settings",
    } as never);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  it("skips auth redirects on public routes", async () => {
    const response = new MockResponse("next");

    updateSessionMock.mockResolvedValue({
      response,
      user: null,
    });

    const result = await middleware({
      nextUrl: { pathname: "/login" },
      url: "https://renyt.ng/login",
    } as never);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });
});
