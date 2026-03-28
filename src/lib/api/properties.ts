import apiClient from "./client";
import type {
  CreatePropertyInput,
  FeeType,
  Property,
  PropertyTypeDefinition,
  PropertyWithImages,
  PropertySearchParams,
  PropertyImage,
  PropertyVideo,
  UploadPropertyMediaInput,
  PropertyAgentContact,
  ApiSuccessResponse,
} from "@/types";
import { serializePropertyTypes } from "@/lib/utils";

interface RawAgentProfile {
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
}

interface RawAgentNode {
  business_name: string | null;
  profiles?: RawAgentProfile | RawAgentProfile[] | null;
}

interface RawProperty extends Property {
  images?: PropertyImage[];
  property_images?: PropertyImage[];
  property_videos?: PropertyVideo[];
  agents?: RawAgentNode | null;
}

function normalizeAgentContact(
  agent: RawAgentNode | null | undefined,
): PropertyAgentContact | undefined {
  if (!agent) {
    return undefined;
  }

  const profile = Array.isArray(agent.profiles)
    ? (agent.profiles[0] ?? null)
    : (agent.profiles ?? null);

  return {
    business_name: agent.business_name ?? null,
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
}

function normalizeProperty<T extends RawProperty>(property: T): T & PropertyWithImages {
  return {
    ...property,
    images: property.images ?? property.property_images ?? [],
    property_images: property.property_images ?? property.images ?? [],
    property_videos: property.property_videos ?? [],
    agent_contact: normalizeAgentContact(property.agents),
  };
}

function mapSearchParams(params?: PropertySearchParams) {
  if (!params) {
    return undefined;
  }

  return {
    area: params.area,
    location_slug: params.location_slug,
    property_type: serializePropertyTypes(params.property_type ?? []),
    listing_purpose: params.listing_purpose,
    minPrice: params.min_price,
    maxPrice: params.max_price,
    bedrooms: params.bedrooms,
    verified: params.status === undefined ? undefined : undefined,
    page: params.page,
    limit: params.limit,
    sort:
      params.sort_by === "rent_amount"
        ? params.sort_order === "desc"
          ? "price_desc"
          : "price_asc"
        : params.sort_order === "desc"
          ? "recent"
          : undefined,
  };
}

export async function searchProperties(params?: PropertySearchParams) {
  const res = await apiClient.get<ApiSuccessResponse<Property[]>>(
    "/properties",
    { params: mapSearchParams(params) },
  );
  return {
    ...res.data,
    data: (res.data.data ?? []).map((property) =>
      normalizeProperty(property as RawProperty),
    ),
  };
}

export async function getProperty(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<PropertyWithImages>>(
    `/properties/${id}`,
  );
  return {
    ...res.data,
    data: normalizeProperty(res.data.data as RawProperty),
  };
}

export async function getManageProperty(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<PropertyWithImages>>(
    `/properties/${id}/manage`,
  );
  return {
    ...res.data,
    data: normalizeProperty(res.data.data as RawProperty),
  };
}

export async function createProperty(
  data: CreatePropertyInput,
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
  return {
    ...res.data,
    data: normalizeProperty(res.data.data as RawProperty),
  };
}

export async function getMyProperties() {
  const res =
    await apiClient.get<ApiSuccessResponse<Property[]>>("/properties/mine");
  return {
    ...res.data,
    data: (res.data.data ?? []).map((property) =>
      normalizeProperty(property as RawProperty),
    ),
  };
}

export async function getFeeTypes() {
  const res = await apiClient.get<ApiSuccessResponse<FeeType[]>>(
    "/properties/fee-types",
  );
  return res.data;
}

export async function getPropertyTypes() {
  const res = await apiClient.get<ApiSuccessResponse<PropertyTypeDefinition[]>>(
    "/properties/types",
  );
  return res.data;
}

export async function createFeeType(data: {
  name: string;
  description?: string | null;
  supports_fixed?: boolean;
  supports_percentage?: boolean;
}) {
  const res = await apiClient.post<ApiSuccessResponse<FeeType>>(
    "/properties/fee-types",
    data,
  );
  return res.data;
}

export async function uploadPropertyImage(id: string, data: UploadPropertyMediaInput) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyImage>>(
    `/properties/${id}/images`,
    data,
  );
  return res.data;
}

export async function reorderPropertyImages(id: string, imageIds: string[]) {
  const res = await apiClient.patch<ApiSuccessResponse<PropertyImage[]>>(
    `/properties/${id}/images/reorder`,
    { image_ids: imageIds },
  );
  return res.data;
}

export async function setPropertyCoverImage(id: string, imageId: string) {
  const res = await apiClient.patch<ApiSuccessResponse<PropertyImage>>(
    `/properties/${id}/images/${imageId}/cover`,
  );
  return res.data;
}

export async function deletePropertyImage(id: string, imageId: string) {
  const res = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
    `/properties/${id}/images/${imageId}`,
  );
  return res.data;
}

export async function uploadPropertyVideo(id: string, data: UploadPropertyMediaInput) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyVideo>>(
    `/properties/${id}/video`,
    data,
  );
  return res.data;
}

export async function deletePropertyVideo(id: string, videoId: string) {
  const res = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
    `/properties/${id}/video/${videoId}`,
  );
  return res.data;
}

export async function publishProperty(id: string) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyWithImages>>(
    `/properties/${id}/publish`,
  );
  return {
    ...res.data,
    data: normalizeProperty(res.data.data as RawProperty),
  };
}
