import apiClient from "./client";
import type {
  Agent,
  AgentVerificationDocumentType,
  AgentVerificationSettings,
  ApiSuccessResponse,
} from "@/types";

export async function createAgent(
  data: {
    business_name: string;
    business_address: string;
    verification_documents: Array<{
      document_type: AgentVerificationDocumentType;
      file_name: string;
      content_type: string;
      base64_data: string;
    }>;
  },
) {
  const res = await apiClient.post<ApiSuccessResponse<Agent>>("/agents", data);
  return res.data;
}

export async function getAgentVerificationSettings() {
  const res = await apiClient.get<ApiSuccessResponse<AgentVerificationSettings>>(
    "/agents/verification-settings",
  );
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
