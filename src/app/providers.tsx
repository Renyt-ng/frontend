"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { authApi, clearAuthToken, setAuthToken } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

async function syncAuthenticatedUser(accessToken: string) {
  setAuthToken(accessToken);
  const response = await authApi.getProfile();
  return response.data;
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        clearAuthToken();
        setLoading(false);
        return;
      }

      try {
        const profile = await syncAuthenticatedUser(session.access_token);
        setUser(profile);
      } catch {
        clearAuthToken();
        setUser(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        clearAuthToken();
        setUser(null);
        return;
      }

      syncAuthenticatedUser(session.access_token)
        .then((profile) => setUser(profile))
        .catch(() => {
          clearAuthToken();
          setUser(null);
        });
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
        <Suspense fallback={null}>
          <AuthOverlay />
        </Suspense>
      </AuthInitializer>
    </QueryClientProvider>
  );
}
