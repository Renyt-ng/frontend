import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/authStore";
import type { Profile } from "@/types";

const TEST_USER: Profile = {
  id: "user-1",
  email: "test@renyt.ng",
  full_name: "Test User",
  phone: "+2340000000000",
  avatar_url: null,
  role: "tenant",
  created_at: "2025-01-01T00:00:00Z",
};

describe("authStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it("starts with no user and isLoading true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it("setUser populates user and sets isAuthenticated", () => {
    useAuthStore.getState().setUser(TEST_USER);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(TEST_USER);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("setUser(null) clears authentication", () => {
    useAuthStore.getState().setUser(TEST_USER);
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setLoading controls loading state", () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it("logout clears user and resets state", () => {
    useAuthStore.getState().setUser(TEST_USER);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
