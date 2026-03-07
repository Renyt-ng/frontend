import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { leasesApi } from "@/lib/api";
import type { Lease, ApiSuccessResponse } from "@/types";

/** Query key factory for leases */
export const leaseKeys = {
  all: ["leases"] as const,
  mine: () => [...leaseKeys.all, "mine"] as const,
};

/** Get the current user's leases */
export function useMyLeases(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Lease[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: leaseKeys.mine(),
    queryFn: () => leasesApi.getMyLeases(),
    ...options,
  });
}

/** Create a new lease (agent action) */
export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leasesApi.createLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.all });
    },
  });
}

/** Send a lease for signing */
export function useSendLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leasesApi.sendLease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.all });
    },
  });
}

/** Sign a lease */
export function useSignLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leasesApi.signLease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.all });
    },
  });
}
