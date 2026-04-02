import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { propertiesApi } from "@/lib/api";
import type {
  AgentPropertyInsight,
  FeeType,
  Property,
  PropertyTypeDefinition,
  PropertyWithImages,
  PropertySearchParams,
  PropertyImage,
  PropertyVideo,
  ReferralOutcomeCandidate,
  ApiSuccessResponse,
  UpdatePropertyInput,
  UploadPropertyMediaInput,
} from "@/types";

/** Query key factory for properties */
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (params: PropertySearchParams) =>
    [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  manage: (id: string) => [...propertyKeys.all, "manage", id] as const,
  mine: () => [...propertyKeys.all, "mine"] as const,
  insights: () => [...propertyKeys.all, "insights"] as const,
  outcomeCandidates: (id: string) => [...propertyKeys.all, "outcome-candidates", id] as const,
  feeTypes: () => [...propertyKeys.all, "fee-types"] as const,
  propertyTypes: () => [...propertyKeys.all, "property-types"] as const,
};

/** Search/list properties with filters */
export function useProperties(
  params?: PropertySearchParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Property[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.list(params ?? {}),
    queryFn: ({ signal }) => propertiesApi.searchProperties(params, signal),
    ...options,
  });
}

/** Get a single property by ID */
export function useProperty(
  id: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<PropertyWithImages>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesApi.getProperty(id),
    enabled: !!id,
    ...options,
  });
}

export function useManageProperty(
  id: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<PropertyWithImages>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.manage(id),
    queryFn: () => propertiesApi.getManageProperty(id),
    enabled: !!id,
    ...options,
  });
}

/** Get current agent's properties */
export function useMyProperties(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Property[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.mine(),
    queryFn: () => propertiesApi.getMyProperties(),
    ...options,
  });
}

export function useMyPropertyInsights(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AgentPropertyInsight[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.insights(),
    queryFn: () => propertiesApi.getMyPropertyInsights(),
    ...options,
  });
}

export function usePropertyOutcomeCandidates(
  propertyId: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ReferralOutcomeCandidate[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.outcomeCandidates(propertyId),
    queryFn: () => propertiesApi.getPropertyOutcomeCandidates(propertyId),
    enabled: Boolean(propertyId),
    ...options,
  });
}

/** Create a new property listing */
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertiesApi.createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
}

/** Update an existing property */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyInput }) =>
      propertiesApi.updateProperty(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: propertyKeys.manage(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.insights() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.outcomeCandidates(variables.id) });
    },
  });
}

export function useFeeTypes(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<FeeType[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.feeTypes(),
    queryFn: () => propertiesApi.getFeeTypes(),
    ...options,
  });
}

export function usePropertyTypes(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<PropertyTypeDefinition[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: propertyKeys.propertyTypes(),
    queryFn: () => propertiesApi.getPropertyTypes(),
    ...options,
  });
}

export function useCreateFeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertiesApi.createFeeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.feeTypes() });
    },
  });
}

export function usePublishProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertiesApi.publishProperty,
    onSuccess: (_data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useConfirmPropertyAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertiesApi.confirmPropertyAvailability,
    onSuccess: (_data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useUploadPropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UploadPropertyMediaInput }) =>
      propertiesApi.uploadPropertyImage(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
  });
}

export function useReorderPropertyImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageIds }: { id: string; imageIds: string[] }) =>
      propertiesApi.reorderPropertyImages(id, imageIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
    },
  });
}

export function useSetPropertyCoverImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      propertiesApi.setPropertyCoverImage(id, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
    },
  });
}

export function useDeletePropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      propertiesApi.deletePropertyImage(id, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
  });
}

export function useUploadPropertyVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UploadPropertyMediaInput }) =>
      propertiesApi.uploadPropertyVideo(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
  });
}

export function useDeletePropertyVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, videoId }: { id: string; videoId: string }) =>
      propertiesApi.deletePropertyVideo(id, videoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.manage(variables.id) });
    },
  });
}
