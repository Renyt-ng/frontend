import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyInteractionsApi } from "@/lib/api";
import type { CreatePropertyMessageIntentInput } from "@/types";

export const propertyInteractionKeys = {
  all: ["property-interactions"] as const,
  summary: () => [...propertyInteractionKeys.all, "summary"] as const,
  engagementStatus: (propertyId: string) =>
    [...propertyInteractionKeys.all, "engagement-status", propertyId] as const,
};

export function useMyPropertyEngagementSummary(enabled = true) {
  return useQuery({
    queryKey: propertyInteractionKeys.summary(),
    queryFn: () => propertyInteractionsApi.getMyEngagementSummary(),
    enabled,
    staleTime: 30_000,
  });
}

export function usePropertyEngagementStatus(propertyId: string, enabled = true) {
  return useQuery({
    queryKey: propertyInteractionKeys.engagementStatus(propertyId),
    queryFn: () => propertyInteractionsApi.getEngagementStatus(propertyId),
    enabled: enabled && Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useTogglePropertyEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      propertyId: string;
      engagementType: "wishlist" | "like";
      active: boolean;
    }) => {
      return params.active
        ? propertyInteractionsApi.removeEngagement(
            params.propertyId,
            params.engagementType,
          )
        : propertyInteractionsApi.addEngagement(
            params.propertyId,
            params.engagementType,
          );
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        propertyInteractionKeys.engagementStatus(variables.propertyId),
        data,
      );
    },
  });
}

export function useTrackPropertyMessageIntent() {
  return useMutation({
    mutationFn: ({
      propertyId,
      data,
    }: {
      propertyId: string;
      data: CreatePropertyMessageIntentInput;
    }) => propertyInteractionsApi.createMessageIntent(propertyId, data),
  });
}