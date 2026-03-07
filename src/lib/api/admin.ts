import apiClient from "./client";
import type { Agent, Property, Profile, ApiSuccessResponse } from "@/types";

/** Approve or reject an agent */
export async function updateAgentStatus(
  id: string,
  verification_status: "approved" | "rejected",
) {
  const res = await apiClient.patch<ApiSuccessResponse<Agent>>(
    `/admin/agents/${id}`,
    { verification_status },
  );
  return res.data;
}

/** Verify or reject a property listing */
export async function verifyProperty(
  id: string,
  verification_status: "approved" | "rejected",
) {
  const res = await apiClient.patch<ApiSuccessResponse<Property>>(
    `/admin/properties/${id}/verify`,
    { verification_status },
  );
  return res.data;
}

/** Suspend a user */
export async function suspendUser(id: string) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    `/admin/users/${id}/suspend`,
  );
  return res.data;
}
