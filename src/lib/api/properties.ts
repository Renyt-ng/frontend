import apiClient from "./client";
import type {
  Property,
  PropertyWithImages,
  PropertySearchParams,
  ApiSuccessResponse,
} from "@/types";

export async function searchProperties(params?: PropertySearchParams) {
  const res = await apiClient.get<ApiSuccessResponse<Property[]>>(
    "/properties",
    { params },
  );
  return res.data;
}

export async function getProperty(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<PropertyWithImages>>(
    `/properties/${id}`,
  );
  return res.data;
}

export async function createProperty(
  data: Omit<
    Property,
    | "id"
    | "created_at"
    | "last_updated_at"
    | "is_verified"
    | "verification_status"
    | "status"
  >,
) {
  const res = await apiClient.post<ApiSuccessResponse<Property>>(
    "/properties",
    data,
  );
  return res.data;
}

export async function updateProperty(id: string, data: Partial<Property>) {
  const res = await apiClient.patch<ApiSuccessResponse<Property>>(
    `/properties/${id}`,
    data,
  );
  return res.data;
}

export async function getMyProperties() {
  const res =
    await apiClient.get<ApiSuccessResponse<Property[]>>("/properties/mine");
  return res.data;
}
