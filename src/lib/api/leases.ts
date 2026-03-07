import apiClient from "./client";
import type { Lease, ApiSuccessResponse } from "@/types";

type CreateLeaseData = Pick<
  Lease,
  | "property_id"
  | "tenant_id"
  | "application_id"
  | "lease_start_date"
  | "lease_end_date"
  | "rent_amount"
  | "terms"
>;

export async function createLease(data: CreateLeaseData) {
  const res = await apiClient.post<ApiSuccessResponse<Lease>>("/leases", data);
  return res.data;
}

export async function sendLease(id: string) {
  const res = await apiClient.post<ApiSuccessResponse<Lease>>(
    `/leases/${id}/send`,
  );
  return res.data;
}

export async function signLease(id: string) {
  const res = await apiClient.post<ApiSuccessResponse<Lease>>(
    `/leases/${id}/sign`,
  );
  return res.data;
}

export async function getMyLeases() {
  const res = await apiClient.get<ApiSuccessResponse<Lease[]>>("/leases/mine");
  return res.data;
}
