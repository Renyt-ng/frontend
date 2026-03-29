import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import type {
  Agent,
  AdminReferralEvent,
  ApiSuccessResponse,
  Location,
  ListingFreshnessPolicy,
  Property,
  PropertyTypeDefinition,
  ReferralCampaign,
  ReferralClosureStatus,
  ReferralEventStatus,
  ReferralProgramAdminConfig,
  ReferralProgramSettings,
} from "@/types";
import type {
  AdminAuditLog,
  AdminOverview,
  EmailDeliveryEvent,
  EmailHealthReport,
  EmailNotificationSettings,
  EmailProviderSettings,
  EmailTestSendResult,
} from "@/types/admin";
import type {
  AdminUser,
  GetAdminAuditLogsParams,
  GetAdminUsersParams,
  GetAdminAgentsParams,
  GetAdminEmailEventsParams,
  GetAdminLocationsParams,
  GetAdminPropertiesParams,
  GetAdminReferralEventsParams,
} from "@/lib/api/admin";

export const adminKeys = {
  overview: () => ["admin", "overview"] as const,
  auditLogs: (params?: GetAdminAuditLogsParams) =>
    ["admin", "audit-logs", params] as const,
  referrals: (params?: GetAdminReferralEventsParams) =>
    ["admin", "referrals", params] as const,
  referralProgram: () => ["admin", "referrals", "program"] as const,
  listingFreshnessPolicy: () => ["admin", "listing-freshness-policy"] as const,
  users: (params?: GetAdminUsersParams) => ["admin", "users", params] as const,
  agents: (params?: GetAdminAgentsParams) => ["admin", "agents", params] as const,
  properties: (params?: GetAdminPropertiesParams) =>
    ["admin", "properties", params] as const,
  locations: (params?: GetAdminLocationsParams) =>
    ["admin", "locations", params] as const,
  propertyTypes: () => ["admin", "property-types"] as const,
  emailProviders: () => ["admin", "email-providers"] as const,
  emailNotifications: () => ["admin", "email-notifications"] as const,
  emailHealth: () => ["admin", "email-health"] as const,
  emailEvents: (params?: GetAdminEmailEventsParams) =>
    ["admin", "email-events", params] as const,
};

export function useAdminOverview(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminOverview>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: () => adminApi.getOverview(),
    ...options,
  });
}

export function useAdminAuditLogs(
  params?: GetAdminAuditLogsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminAuditLog[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminApi.getAuditLogs(params),
    ...options,
  });
}

export function useAdminUsers(
  params?: GetAdminUsersParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminUser[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
    ...options,
  });
}

export function useAdminReferralEvents(
  params?: GetAdminReferralEventsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminReferralEvent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.referrals(params),
    queryFn: () => adminApi.getReferralEvents(params),
    ...options,
  });
}

export function useAdminReferralProgram(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ReferralProgramAdminConfig>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.referralProgram(),
    queryFn: () => adminApi.getReferralProgram(),
    ...options,
  });
}

export function useAdminListingFreshnessPolicy(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<ListingFreshnessPolicy>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.listingFreshnessPolicy(),
    queryFn: () => adminApi.getListingFreshnessPolicy(),
    ...options,
  });
}

export function useUpdateListingFreshnessPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateListingFreshnessPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listing-freshness-policy"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateReferralProgramSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateReferralProgramSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useCreateReferralCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createReferralCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useUpdateReferralCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string | null;
        is_active?: boolean;
        priority?: number;
        property_id?: string | null;
        listing_purpose?: "rent" | "sale" | null;
        area?: string | null;
        starts_at?: string | null;
        ends_at?: string | null;
        commission_type?: ReferralCampaign["commission_type"];
        commission_value?: number;
        commission_basis_source?: ReferralCampaign["commission_basis_source"];
        fallback_commission_amount?: number;
      };
    }) => adminApi.updateReferralCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useUpdateReferralEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status: ReferralEventStatus;
        close_status?: ReferralClosureStatus | null;
        rejection_reason?: string | null;
        admin_note?: string | null;
      };
    }) => adminApi.updateReferralEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.suspendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUserAvatarReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        avatar_review_status: "approved" | "flagged";
        avatar_review_note?: string | null;
      };
    }) => adminApi.updateUserAvatarReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useAdminAgents(
  params?: GetAdminAgentsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Agent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.agents(params),
    queryFn: () => adminApi.getAgents(params),
    ...options,
  });
}

export function useAdminProperties(
  params?: GetAdminPropertiesParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Property[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.properties(params),
    queryFn: () => adminApi.getProperties(params),
    ...options,
  });
}

export function useAdminLocations(
  params?: GetAdminLocationsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<Location[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.locations(params),
    queryFn: () => adminApi.getLocations(params),
    ...options,
  });
}

export function useCreateAdminLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateAdminLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        slug?: string;
        name?: string;
        display_name?: string;
        kind?: "area" | "lga";
        parent_name?: string | null;
        aliases?: string[];
        is_active?: boolean;
        sort_order?: number;
        popularity_rank?: number;
      };
    }) => adminApi.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      verification_status,
    }: {
      id: string;
      verification_status: "approved" | "rejected";
    }) => adminApi.updateAgentStatus(id, verification_status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "agents"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useVerifyProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      verification_status,
    }: {
      id: string;
      verification_status: "approved" | "rejected";
    }) => adminApi.verifyProperty(id, verification_status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useAdminPropertyTypes(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<PropertyTypeDefinition[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.propertyTypes(),
    queryFn: () => adminApi.getPropertyTypes(),
    ...options,
  });
}

export function useCreateAdminPropertyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createPropertyType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "property-types"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "property-types"] });
    },
  });
}

export function useUpdateAdminPropertyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        label?: string;
        description?: string | null;
        is_active?: boolean;
        sort_order?: number;
      };
    }) => adminApi.updatePropertyType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "property-types"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "property-types"] });
    },
  });
}

export function useAdminEmailProviders(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<EmailProviderSettings[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.emailProviders(),
    queryFn: () => adminApi.getEmailProviders(),
    ...options,
  });
}

export function useUpdateAdminEmailProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status?: EmailProviderSettings["status"];
        is_enabled?: boolean;
        is_primary?: boolean;
        fallback_order?: number | null;
        from_email?: string | null;
        from_name?: string | null;
        configuration?: Record<string, unknown>;
        health_metadata?: Record<string, unknown>;
      };
    }) => adminApi.updateEmailProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminEmailNotifications(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<EmailNotificationSettings[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.emailNotifications(),
    queryFn: () => adminApi.getEmailNotifications(),
    ...options,
  });
}

export function useAdminEmailHealth(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<EmailHealthReport[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.emailHealth(),
    queryFn: () => adminApi.getEmailHealth(),
    ...options,
  });
}

export function useAdminEmailEvents(
  params?: GetAdminEmailEventsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<EmailDeliveryEvent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.emailEvents(params),
    queryFn: () => adminApi.getEmailEvents(params),
    ...options,
  });
}

export function useSendAdminTestEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.sendEmailTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email-health"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "email-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "email-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useUpdateAdminEmailNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        is_enabled?: boolean;
        provider_override?: EmailNotificationSettings["provider_override"];
        subject_template?: string | null;
        template_mappings?: Record<string, unknown>;
        paused_until?: string | null;
        pause_reason?: string | null;
      };
    }) => adminApi.updateEmailNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email-notifications"] });
    },
  });
}