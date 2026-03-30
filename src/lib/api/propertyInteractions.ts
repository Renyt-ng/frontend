import apiClient from "./client";
import type {
  ApiSuccessResponse,
  PropertyEngagementSummary,
  CreatePropertyMessageIntentInput,
  PropertyEngagementStatus,
  PropertyMessageIntentResult,
} from "@/types";

export async function getMyEngagementSummary() {
  const res = await apiClient.get<ApiSuccessResponse<PropertyEngagementSummary>>(
    "/properties/engagements/summary",
  );
  return res.data;
}

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

export async function createMessageIntent(
  propertyId: string,
  data: CreatePropertyMessageIntentInput,
) {
  const res = await apiClient.post<
    ApiSuccessResponse<PropertyMessageIntentResult>
  >(`/properties/${propertyId}/message-intents`, data);
  return res.data;
}