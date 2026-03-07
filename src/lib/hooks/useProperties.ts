import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { propertiesApi } from "@/lib/api";
import type {
  Property,
  PropertyWithImages,
  PropertySearchParams,
  ApiSuccessResponse,
} from "@/types";

/** Query key factory for properties */
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (params: PropertySearchParams) =>
    [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  mine: () => [...propertyKeys.all, "mine"] as const,
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
    queryFn: () => propertiesApi.searchProperties(params),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) =>
      propertiesApi.updateProperty(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: propertyKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
  });
}
