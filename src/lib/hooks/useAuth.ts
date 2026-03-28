import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { Profile, ApiSuccessResponse } from "@/types";

/** Query key factory for auth/profile */
export const profileKeys = {
  me: ["profile", "me"] as const,
};

/** Fetch the current user's profile from the backend API */
export function useProfile(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Profile>>,
    "queryKey" | "queryFn"
  >,
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
    ...options,
  });
}

/** Update current user's profile */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(profileKeys.me, res);
    },
  });
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.uploadProfileAvatar,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(profileKeys.me, res);
    },
  });
}
