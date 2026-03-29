import type { User } from "@supabase/supabase-js";
import { authApi, clearAuthToken, setAuthToken } from "@/lib/api";
import {
  buildFallbackProfile,
  isTransientAuthError,
  isUnauthorizedAuthError,
} from "@/lib/authSession";
import type { Profile } from "@/types";

export async function syncAuthenticatedProfile(
  accessToken: string,
  authUser: User,
  existingProfile?: Profile | null,
) {
  setAuthToken(accessToken);

  try {
    const response = await authApi.getProfile();
    return response.data;
  } catch (error) {
    if (isTransientAuthError(error)) {
      return buildFallbackProfile(authUser, existingProfile);
    }

    if (isUnauthorizedAuthError(error)) {
      clearAuthToken();
    }

    throw error;
  }
}