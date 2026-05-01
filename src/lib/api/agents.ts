import apiClient from "./client";
import type {
  Agent,
  AgentVerificationDocumentType,
  AgentVerificationSettings,
  PhoneVerificationStatus,
  ApiSuccessResponse,
} from "@/types";

export async function createAgent(
  data: {
    business_name: string;
    business_address: string;
    whatsapp_same_as_primary_phone: boolean;
    primary_phone?: string | null;
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

export async function getPhoneVerificationStatus() {
  const res = await apiClient.get<ApiSuccessResponse<PhoneVerificationStatus>>(
    "/agents/phone-verification",
  );
  return res.data;
}

export async function requestPhoneVerification(data: { phone: string }) {
  const res = await apiClient.post<ApiSuccessResponse<PhoneVerificationStatus>>(
    "/agents/phone-verification/request",
    data,
  );
  return res.data;
}

export async function verifyPhoneVerification(data: { code: string }) {
  const res = await apiClient.post<ApiSuccessResponse<PhoneVerificationStatus>>(
    "/agents/phone-verification/verify",
    data,
  );
  return res.data;
}

export async function updateMyAgentContact(data: {
  whatsapp_same_as_primary_phone: boolean;
  primary_phone?: string | null;
}) {
  const res = await apiClient.patch<ApiSuccessResponse<Agent>>(
    "/agents/me/contact",
    data,
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
