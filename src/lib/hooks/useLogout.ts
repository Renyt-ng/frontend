"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { clearAuthToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useLogout() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);

  return async function logout(redirectTo = "/") {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    await supabase.auth.signOut();
    clearAuthToken();
    logoutStore();
    router.push(redirectTo);
    router.refresh();
  };
}