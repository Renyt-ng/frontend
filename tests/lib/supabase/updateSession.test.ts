import { beforeEach, describe, expect, it, vi } from "vitest";

const { nextMock, createServerClientMock, getUserMock } = vi.hoisted(() => ({
  nextMock: vi.fn(() => new MockResponse()),
  createServerClientMock: vi.fn(),
  getUserMock: vi.fn(),
}));

class MockResponse {
  readonly cookies = {
    values: [] as Array<{ name: string; value: string; options?: unknown }>,
    getAll: () => this.cookies.values,
    set: (name: string, value: string, options?: unknown) => {
      this.cookies.values.push({ name, value, options });
    },
  };
}

vi.mock("next/server", () => ({
  NextResponse: {
    next: nextMock,
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("updateSession", () => {
  beforeEach(() => {
    nextMock.mockClear();
    createServerClientMock.mockReset();
    getUserMock.mockReset();
  });

  it("skips Supabase auth refresh when no auth cookies exist", async () => {
    const result = await updateSession({
      cookies: {
        getAll: () => [{ name: "theme", value: "light" }],
      },
    } as never);

    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(result.user).toBeNull();
    expect(result.authError).toBeNull();
  });

  it("marks timeout failures as transient when auth cookies exist", async () => {
    getUserMock.mockRejectedValue({
      message: "fetch failed",
      cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
    });
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
      },
    });

    const result = await updateSession({
      cookies: {
        getAll: () => [{ name: "sb-project-auth-token.0", value: "token" }],
        set: vi.fn(),
      },
    } as never);

    expect(createServerClientMock).toHaveBeenCalledOnce();
    expect(result.user).toBeNull();
    expect(result.authError).toBe("transient");
  });
});