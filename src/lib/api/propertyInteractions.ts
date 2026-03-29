import apiClient from "./client";
import type {
  AgentPropertyInquiry,
  ApiSuccessResponse,
  CreatePropertyInquiryInput,
  CreatePropertyMessageIntentInput,
  PropertyEngagementStatus,
  PropertyInquiry,
  PropertyMessageIntentResult,
} from "@/types";

export async function getEngagementStatus(propertyId: string) {
  const res = await apiClient.get<ApiSuccessResponse<PropertyEngagementStatus>>(
    `/properties/${propertyId}/engagements/me`,
  );
  return res.data;
}

export async function addEngagement(
  propertyId: string,
  engagementType: "wishlist" | "like",
) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyEngagementStatus>>(
    `/properties/${propertyId}/engagements/${engagementType}`,
  );
  return res.data;
}

export async function removeEngagement(
  propertyId: string,
  engagementType: "wishlist" | "like",
) {
  const res = await apiClient.delete<ApiSuccessResponse<PropertyEngagementStatus>>(
    `/properties/${propertyId}/engagements/${engagementType}`,
  );
  return res.data;
}

export async function createInquiry(
  propertyId: string,
  data: CreatePropertyInquiryInput,
) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyInquiry>>(
    `/properties/${propertyId}/inquiries`,
    data,
  );
  return res.data;
}

export async function getMyInquiry(propertyId: string) {
  const res = await apiClient.get<ApiSuccessResponse<PropertyInquiry | null>>(
    `/properties/${propertyId}/inquiries/me`,
  );
  return res.data;
}

export async function getAgentInquiries() {
  const res = await apiClient.get<ApiSuccessResponse<AgentPropertyInquiry[]>>(
    "/properties/inquiries/mine",
  );
  return res.data;
}

export async function createMessageIntent(
  propertyId: string,
  data: CreatePropertyMessageIntentInput,
) {
  const res = await apiClient.post<
    ApiSuccessResponse<PropertyMessageIntentResult>
  >(`/properties/${propertyId}/message-intents`, data);
  return res.data;
}