import { describe, expect, it, vi, beforeEach } from "vitest";
import { syncAuthenticatedProfile } from "@/lib/authProfile";

const { getProfile, setAuthToken, clearAuthToken } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  authApi: {
    getProfile,
  },
  setAuthToken,
  clearAuthToken,
}));

describe("authProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the auth metadata avatar when the profile response has not persisted it yet", async () => {
    getProfile.mockResolvedValue({
      data: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Agent",
        phone: null,
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "tenant",
        created_at: "2026-04-03T00:00:00.000Z",
      },
    });

    const profile = await syncAuthenticatedProfile("access-token", {
      id: "user-1",
      email: "ada@example.com",
      created_at: "2026-04-03T00:00:00.000Z",
      user_metadata: {
        full_name: "Ada Agent",
        role: "tenant",
        avatar_url: "https://cdn.renyt.ng/avatar.jpg",
      },
    } as never);

    expect(setAuthToken).toHaveBeenCalledWith("access-token");
    expect(profile.avatar_url).toBe("https://cdn.renyt.ng/avatar.jpg");
    expect(profile.full_name).toBe("Ada Agent");
  });

  it("falls back to the Google picture when the API profile has no uploaded avatar yet", async () => {
    getProfile.mockResolvedValue({
      data: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Agent",
        phone: null,
        avatar_url: null,
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "tenant",
        created_at: "2026-04-03T00:00:00.000Z",
      },
    });

    const profile = await syncAuthenticatedProfile("access-token", {
      id: "user-1",
      email: "ada@example.com",
      created_at: "2026-04-03T00:00:00.000Z",
      user_metadata: {
        full_name: "Ada Agent",
        role: "tenant",
        picture: "https://lh3.googleusercontent.com/avatar.jpg",
      },
    } as never);

    expect(profile.avatar_url).toBe("https://lh3.googleusercontent.com/avatar.jpg");
  });

  it("keeps the uploaded profile avatar over the Google picture", async () => {
    getProfile.mockResolvedValue({
      data: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Agent",
        phone: null,
        avatar_url: "https://cdn.renyt.ng/uploaded-avatar.jpg",
        avatar_review_status: "pending",
        avatar_review_note: null,
        role: "tenant",
        created_at: "2026-04-03T00:00:00.000Z",
      },
    });

    const profile = await syncAuthenticatedProfile("access-token", {
      id: "user-1",
      email: "ada@example.com",
      created_at: "2026-04-03T00:00:00.000Z",
      user_metadata: {
        full_name: "Ada Agent",
        role: "tenant",
        picture: "https://lh3.googleusercontent.com/avatar.jpg",
      },
    } as never);

    expect(profile.avatar_url).toBe("https://cdn.renyt.ng/uploaded-avatar.jpg");
  });
});