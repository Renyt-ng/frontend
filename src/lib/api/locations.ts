import apiClient from "./client";
import type { ApiSuccessResponse, Location, LocationSearchParams } from "@/types";

function mapLocationSearchParams(params?: LocationSearchParams) {
  if (!params) {
    return undefined;
  }

  return {
    q: params.q?.trim() || undefined,
    kind: params.kind && params.kind !== "all" ? params.kind : undefined,
    limit: params.limit,
  };
}

export async function getLocations(
  params?: LocationSearchParams,
  signal?: AbortSignal,
) {
  const res = await apiClient.get<ApiSuccessResponse<Location[]>>("/locations", {
    params: mapLocationSearchParams(params),
    signal,
  });

  return res.data;
}