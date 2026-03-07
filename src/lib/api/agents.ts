import apiClient from "./client";
import type { Agent, ApiSuccessResponse } from "@/types";

export async function createAgent(
  data: Pick<Agent, "business_name" | "business_address" | "id_document_url">,
) {
  const res = await apiClient.post<ApiSuccessResponse<Agent>>("/agents", data);
  return res.data;
}

export async function getMyAgent() {
  const res = await apiClient.get<ApiSuccessResponse<Agent>>("/agents/me");
  return res.data;
}

export async function getAgent(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<Agent>>(`/agents/${id}`);
  return res.data;
}
