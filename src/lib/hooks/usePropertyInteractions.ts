import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyInteractionsApi } from "@/lib/api";
import type {
  CreatePropertyInquiryInput,
  CreatePropertyMessageIntentInput,
} from "@/types";

export const propertyInteractionKeys = {
  all: ["property-interactions"] as const,
  engagementStatus: (propertyId: string) =>
    [...propertyInteractionKeys.all, "engagement-status", propertyId] as const,
  inquiry: (propertyId: string) =>
    [...propertyInteractionKeys.all, "inquiry", propertyId] as const,
  agentInquiries: () => [...propertyInteractionKeys.all, "agent-inquiries"] as const,
};

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

export function useCreatePropertyInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: CreatePropertyInquiryInput }) =>
      propertyInteractionsApi.createInquiry(propertyId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        propertyInteractionKeys.inquiry(variables.propertyId),
        data,
      );
    },
  });
}

export function useMyPropertyInquiry(propertyId: string, enabled = true) {
  return useQuery({
    queryKey: propertyInteractionKeys.inquiry(propertyId),
    queryFn: () => propertyInteractionsApi.getMyInquiry(propertyId),
    enabled: enabled && Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useAgentPropertyInquiries(enabled = true) {
  return useQuery({
    queryKey: propertyInteractionKeys.agentInquiries(),
    queryFn: () => propertyInteractionsApi.getAgentInquiries(),
    enabled,
    staleTime: 30_000,
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