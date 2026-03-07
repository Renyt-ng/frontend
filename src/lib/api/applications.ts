import apiClient from "./client";
import type { Application, ApiSuccessResponse } from "@/types";

type CreateApplicationData = Pick<
  Application,
  | "property_id"
  | "employment_status"
  | "monthly_income"
  | "guarantor_name"
  | "guarantor_phone"
  | "rental_history"
>;

export async function submitApplication(data: CreateApplicationData) {
  const res = await apiClient.post<ApiSuccessResponse<Application>>(
    "/applications",
    data,
  );
  return res.data;
}

export async function getMyApplications() {
  const res =
    await apiClient.get<ApiSuccessResponse<Application[]>>(
      "/applications/mine",
    );
  return res.data;
}

export async function getPropertyApplications(propertyId: string) {
  const res = await apiClient.get<ApiSuccessResponse<Application[]>>(
    `/applications/property/${propertyId}`,
  );
  return res.data;
}

export async function updateApplicationStatus(
  id: string,
  status: Application["status"],
) {
  const res = await apiClient.patch<ApiSuccessResponse<Application>>(
    `/applications/${id}`,
    { status },
  );
  return res.data;
}
