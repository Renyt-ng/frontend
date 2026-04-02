import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api";
import type { ApiSuccessResponse, Location, LocationSearchParams } from "@/types";

export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: LocationSearchParams) => [...locationKeys.lists(), params] as const,
};

export function useLocations(
  params?: LocationSearchParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Location[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: locationKeys.list(params ?? {}),
    queryFn: ({ signal }) => locationsApi.getLocations(params, signal),
    staleTime: 1000 * 60 * 30,
    ...options,
  });
}