import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { referralsApi } from "@/lib/api";
import type {
  ApiSuccessResponse,
  ReferralDashboard,
  ReferralPropertyCommissionPreview,
  ReferralProfile,
  ReferralShareChannel,
  ReferralShareLink,
} from "@/types";

export const referralKeys = {
  all: ["referrals"] as const,
  dashboard: () => [...referralKeys.all, "dashboard"] as const,
  preview: (propertyId: string) => [...referralKeys.all, "preview", propertyId] as const,
};

export function useReferralDashboard(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ReferralDashboard>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: referralKeys.dashboard(),
    queryFn: () => referralsApi.getReferralDashboard(),
    ...options,
  });
}

export function useReferralPropertyPreview(
  propertyId: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ReferralPropertyCommissionPreview>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: referralKeys.preview(propertyId),
    queryFn: () => referralsApi.getReferralPropertyPreview(propertyId),
    enabled: Boolean(propertyId),
    ...options,
  });
}

export function useEnrollReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => referralsApi.enrollReferralProgram(),
    onSuccess: (response: ApiSuccessResponse<ReferralProfile>) => {
      queryClient.setQueryData<ApiSuccessResponse<ReferralDashboard>>(
        referralKeys.dashboard(),
        (current) => {
          if (!current) {
            return {
              success: true,
              message: "OK",
              data: {
                profile: response.data,
                summary: {
                  potential_earnings: 0,
                  under_review_earnings: 0,
                  confirmed_earnings: 0,
                  paid_earnings: 0,
                  rejected_earnings: 0,
                  share_count: 0,
                  qualified_referrals: 0,
                  active_shared_properties: 0,
                },
                recent_activity: [],
                property_performance: [],
              },
            };
          }

          return {
            ...current,
            data: {
              ...current.data,
              profile: response.data,
            },
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: referralKeys.all });
    },
  });
}

export function useCreateReferralShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      data,
    }: {
      propertyId: string;
      data: {
        origin: string;
        channel: ReferralShareChannel;
      };
    }) => referralsApi.createReferralShareLink(propertyId, data),
    onSuccess: (_response: ApiSuccessResponse<ReferralShareLink>) => {
      queryClient.invalidateQueries({ queryKey: referralKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: referralKeys.all });
    },
  });
}