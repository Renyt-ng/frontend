import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, createClientMock, resolvePostAuthDestinationMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: URL | string) => ({ location: url.toString() })),
  createClientMock: vi.fn(),
  resolvePostAuthDestinationMock: vi.fn(() => "/dashboard"),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: redirectMock,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/googleAuth", () => ({
  resolvePostAuthDestination: resolvePostAuthDestinationMock,
}));

import { GET } from "@/app/auth/callback/route";

describe("auth callback route", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    createClientMock.mockReset();
    resolvePostAuthDestinationMock.mockClear();
  });

  it("redirects back to login when Supabase auth is temporarily unavailable", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockRejectedValue({
          message: "fetch failed",
          cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
        }),
      },
    });

    const response = await GET(
      new Request(
        "https://renyt.ng/auth/callback?code=test-code&mode=login&redirectTo=%2Fdashboard",
      ),
    );

    expect(response).toMatchObject({
      location:
        "https://renyt.ng/login?error=Authentication+service+is+temporarily+unavailable.+Try+again.&redirectTo=%2Fdashboard",
    });
  });
});