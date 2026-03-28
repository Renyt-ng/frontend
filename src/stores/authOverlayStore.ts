import { create } from "zustand";
import type { AuthMode, ResumeAction } from "@/lib/authNavigation";

interface OpenAuthOverlayOptions {
  mode?: AuthMode;
  redirectTo?: string;
  resumeAction?: ResumeAction | null;
  onAuthenticated?: (() => void | Promise<void>) | null;
  restoreFocusTo?: HTMLElement | null;
}

interface AuthOverlayState {
  isOpen: boolean;
  mode: AuthMode;
  redirectTo: string;
  resumeAction: ResumeAction | null;
  onAuthenticated: (() => void | Promise<void>) | null;
  restoreFocusTo: HTMLElement | null;
  openOverlay: (options?: OpenAuthOverlayOptions) => void;
  closeOverlay: () => void;
  setMode: (mode: AuthMode) => void;
  completeAuthentication: () => Promise<void>;
}

export const useAuthOverlayStore = create<AuthOverlayState>((set, get) => ({
  isOpen: false,
  mode: "login",
  redirectTo: "/",
  resumeAction: null,
  onAuthenticated: null,
  restoreFocusTo: null,
  openOverlay: (options) =>
    set({
      isOpen: true,
      mode: options?.mode ?? "login",
      redirectTo: options?.redirectTo ?? "/",
      resumeAction: options?.resumeAction ?? null,
      onAuthenticated: options?.onAuthenticated ?? null,
      restoreFocusTo:
        options?.restoreFocusTo ??
        (typeof document !== "undefined"
          ? (document.activeElement as HTMLElement | null)
          : null),
    }),
  closeOverlay: () => {
    const restoreFocusTo = get().restoreFocusTo;

    set({
      isOpen: false,
      onAuthenticated: null,
      resumeAction: null,
      restoreFocusTo: null,
    });

    restoreFocusTo?.focus();
  },
  setMode: (mode) => set({ mode }),
  completeAuthentication: async () => {
    const onAuthenticated = get().onAuthenticated;

    if (onAuthenticated) {
      await onAuthenticated();
    }

    get().closeOverlay();
  },
}));