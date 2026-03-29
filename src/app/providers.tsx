"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthOverlay } from "@/components/auth/AuthOverlay";
import { clearAuthToken } from "@/lib/api";
import { syncAuthenticatedProfile } from "@/lib/authProfile";
import { isTransientAuthError } from "@/lib/authSession";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

function AuthInitializer({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) {
          clearAuthToken();
          setUser(null);
          return;
        }

        try {
          const profile = await syncAuthenticatedProfile(
            session.access_token,
            session.user,
            useAuthStore.getState().user,
          );
          setUser(profile);
        } catch {
          clearAuthToken();
          setUser(null);
        }
      })
      .catch((error) => {
        if (!isTransientAuthError(error)) {
          clearAuthToken();
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
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

      syncAuthenticatedProfile(
        session.access_token,
        session.user,
        useAuthStore.getState().user,
      )
        .then((profile) => setUser(profile))
        .catch((error) => {
          if (isTransientAuthError(error)) {
            return;
          }

          clearAuthToken();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
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
