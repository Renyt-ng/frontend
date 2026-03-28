import apiClient, { setAuthToken, clearAuthToken } from "./client";
import type { Profile, ApiSuccessResponse } from "@/types";

export { setAuthToken, clearAuthToken };

export async function getProfile() {
  const res = await apiClient.get<ApiSuccessResponse<Profile>>("/profiles/me");
  return res.data;
}

export async function updateProfile(
  data: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>,
) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    "/profiles/me",
    data,
  );
  return res.data;
}

export async function uploadProfileAvatar(data: {
  file_name: string;
  content_type: string;
  base64_data: string;
}) {
  const res = await apiClient.post<ApiSuccessResponse<Profile>>(
    "/profiles/me/avatar",
    data,
  );
  return res.data;
}
