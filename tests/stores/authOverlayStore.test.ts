import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

describe("authOverlayStore", () => {
  beforeEach(() => {
    useAuthOverlayStore.setState({
      isOpen: false,
      mode: "login",
      redirectTo: "/",
      resumeAction: null,
      onAuthenticated: null,
      restoreFocusTo: null,
    });
  });

  it("opens the overlay with supplied mode and redirect data", () => {
    useAuthOverlayStore.getState().openOverlay({
      mode: "register",
      redirectTo: "/search?area=Ikeja",
      resumeAction: "wishlist",
    });

    expect(useAuthOverlayStore.getState()).toMatchObject({
      isOpen: true,
      mode: "register",
      redirectTo: "/search?area=Ikeja",
      resumeAction: "wishlist",
    });
  });

  it("can switch auth modes while open", () => {
    useAuthOverlayStore.getState().openOverlay();
    useAuthOverlayStore.getState().setMode("register");

    expect(useAuthOverlayStore.getState().mode).toBe("register");
  });

  it("runs the authenticated callback before closing", async () => {
    const onAuthenticated = vi.fn(async () => undefined);

    useAuthOverlayStore.getState().openOverlay({ onAuthenticated });
    await useAuthOverlayStore.getState().completeAuthentication();

    expect(onAuthenticated).toHaveBeenCalledOnce();
    expect(useAuthOverlayStore.getState().isOpen).toBe(false);
    expect(useAuthOverlayStore.getState().resumeAction).toBeNull();
  });
});