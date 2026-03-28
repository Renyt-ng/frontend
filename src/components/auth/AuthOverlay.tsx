"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";
import { Modal } from "@/components/ui";
import { buildCurrentUrl, type AuthMode } from "@/lib/authNavigation";
import { useAuthOverlayStore } from "@/stores/authOverlayStore";

export function AuthOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isOpen,
    mode,
    redirectTo,
    resumeAction,
    closeOverlay,
    setMode,
    completeAuthentication,
  } = useAuthOverlayStore();

  const currentUrl = useMemo(
    () => buildCurrentUrl(pathname || "/", searchParams),
    [pathname, searchParams],
  );

  async function handleSuccess() {
    const destination = redirectTo || currentUrl;

    if (destination !== currentUrl) {
      router.replace(destination, { scroll: false });
    } else {
      router.refresh();
    }

    await completeAuthentication();
  }

  function renderForm(activeMode: AuthMode) {
    if (activeMode === "register") {
      return (
        <RegisterForm
          embedded
          redirectTo={redirectTo || currentUrl}
          resumeAction={resumeAction}
          onSuccess={handleSuccess}
          onSwitchMode={() => setMode("login")}
        />
      );
    }

    return (
      <LoginForm
        embedded
        redirectTo={redirectTo || currentUrl}
        resumeAction={resumeAction}
        onSuccess={handleSuccess}
        onSwitchMode={() => setMode("register")}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeOverlay}
      dialogClassName="bottom-0 top-auto max-h-[92vh] w-full max-w-none rounded-b-none rounded-t-[28px] border-x-0 border-b-0 sm:inset-0 sm:m-auto sm:max-h-[88vh] sm:max-w-[520px] sm:rounded-[28px] sm:border"
      className="p-0"
      ariaLabel={mode === "login" ? "Sign in dialog" : "Create account dialog"}
      showCloseButton={false}
    >
      {renderForm(mode)}
    </Modal>
  );
}