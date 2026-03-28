import apiClient from "./client";
import type {
  ApiSuccessResponse,
  ReferralDashboard,
  ReferralProfile,
  ReferralPropertyCommissionPreview,
  ReferralShareChannel,
  ReferralShareLink,
} from "@/types";

export async function enrollReferralProgram() {
  const res = await apiClient.post<ApiSuccessResponse<ReferralProfile>>(
    "/referrals/enroll",
    {},
  );
  return res.data;
}

export async function getReferralDashboard() {
  const res = await apiClient.get<ApiSuccessResponse<ReferralDashboard>>(
    "/referrals/me/dashboard",
  );
  return res.data;
}

export async function getReferralPropertyPreview(propertyId: string) {
  const res = await apiClient.get<
    ApiSuccessResponse<ReferralPropertyCommissionPreview>
  >(`/referrals/properties/${propertyId}/preview`);
  return res.data;
}

export async function createReferralShareLink(
  propertyId: string,
  data: {
    origin: string;
    channel: ReferralShareChannel;
  },
) {
  const res = await apiClient.post<ApiSuccessResponse<ReferralShareLink>>(
    `/referrals/properties/${propertyId}/share-link`,
    data,
  );
  return res.data;
}