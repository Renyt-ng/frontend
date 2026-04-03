import apiClient, { setAuthToken, clearAuthToken } from "./client";
import type {
  EmailNotificationPreferences,
  Profile,
  ApiSuccessResponse,
} from "@/types";

export { setAuthToken, clearAuthToken };

export async function getProfile() {
  const res = await apiClient.get<ApiSuccessResponse<Profile>>("/profiles/me");
  return res.data;
}

export interface SignupEmailVerificationStatus {
  email: string;
  verified: boolean;
  code_sent: boolean;
  resend_available_at: string | null;
  expires_at: string | null;
  locked_until: string | null;
  verified_at: string | null;
  development_code?: string;
}

export async function requestSignupEmailVerification(data: { email: string }) {
  const res = await apiClient.post<ApiSuccessResponse<SignupEmailVerificationStatus>>(
    "/auth/signup/email-verification/request",
    data,
  );
  return res.data;
}

export async function verifySignupEmailVerification(data: {
  email: string;
  code: string;
}) {
  const res = await apiClient.post<ApiSuccessResponse<SignupEmailVerificationStatus>>(
    "/auth/signup/email-verification/verify",
    data,
  );
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

export async function updateEmailNotificationPreferences(
  data: EmailNotificationPreferences,
) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    "/profiles/me/email-notification-preferences",
    data,
  );
  return res.data;
}
