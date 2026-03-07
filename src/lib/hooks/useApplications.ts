import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api";
import type {
  Application,
  ApplicationStatus,
  ApiSuccessResponse,
} from "@/types";

/** Query key factory for applications */
export const applicationKeys = {
  all: ["applications"] as const,
  mine: () => [...applicationKeys.all, "mine"] as const,
  byProperty: (propertyId: string) =>
    [...applicationKeys.all, "property", propertyId] as const,
};

/** Get the current user's applications */
export function useMyApplications(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Application[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: applicationKeys.mine(),
    queryFn: () => applicationsApi.getMyApplications(),
    ...options,
  });
}

/** Get applications for a specific property (agent view) */
export function usePropertyApplications(
  propertyId: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Application[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: applicationKeys.byProperty(propertyId),
    queryFn: () => applicationsApi.getPropertyApplications(propertyId),
    enabled: !!propertyId,
    ...options,
  });
}

/** Submit a new rental application */
export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationsApi.submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

/** Update application status (approve/reject) */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsApi.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
