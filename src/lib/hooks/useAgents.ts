import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { agentsApi } from "@/lib/api";
import type {
  Agent,
  AgentVerificationSettings,
  ApiSuccessResponse,
  PhoneVerificationStatus,
} from "@/types";
import { profileKeys } from "./useAuth";

/** Query key factory for agents */
export const agentKeys = {
  all: ["agents"] as const,
  me: () => [...agentKeys.all, "me"] as const,
  verificationSettings: () => [...agentKeys.all, "verification-settings"] as const,
  phoneVerification: () => [...agentKeys.all, "phone-verification"] as const,
  detail: (id: string) => [...agentKeys.all, id] as const,
};

export function useAgentVerificationSettings(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AgentVerificationSettings>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: agentKeys.verificationSettings(),
    queryFn: () => agentsApi.getAgentVerificationSettings(),
    ...options,
  });
}

/** Get the current user's agent profile */
export function useMyAgent(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Agent>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: agentKeys.me(),
    queryFn: () => agentsApi.getMyAgent(),
    ...options,
  });
}

export function usePhoneVerificationStatus(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<PhoneVerificationStatus>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: agentKeys.phoneVerification(),
    queryFn: () => agentsApi.getPhoneVerificationStatus(),
    ...options,
  });
}

/** Get an agent by ID */
export function useAgent(
  id: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Agent>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => agentsApi.getAgent(id),
    enabled: !!id,
    ...options,
  });
}

/** Register as an agent */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: agentsApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.me() });
      queryClient.invalidateQueries({ queryKey: agentKeys.verificationSettings() });
    },
  });
}

export function useRequestPhoneVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: agentsApi.requestPhoneVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.phoneVerification() });
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useVerifyPhoneVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: agentsApi.verifyPhoneVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.phoneVerification() });
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
