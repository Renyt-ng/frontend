import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { agentsApi } from "@/lib/api";
import type { Agent, ApiSuccessResponse } from "@/types";

/** Query key factory for agents */
export const agentKeys = {
  all: ["agents"] as const,
  me: () => [...agentKeys.all, "me"] as const,
  detail: (id: string) => [...agentKeys.all, id] as const,
};

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
    },
  });
}
