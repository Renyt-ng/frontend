import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import type {
  Agent,
  AgentVerificationSettings,
  AdminReferralEvent,
  ApiSuccessResponse,
  FeeType,
  Location,
  ListingFreshnessPolicy,
  Property,
  PropertyTypeDefinition,
  ReferralCampaign,
  ReferralClosureStatus,
  AdminAgentActivationCandidate,
  AdminAgentVerificationWorkspace,
  AdminCtaInsightEvent,
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
  AdminWorkflowDigestSchedule,
  ManagedQueueName,
  QueueActionResult,
  QueueFailedJobSummary,
  QueueHealthReport,
  SmsDeliveryEvent,
  SmsOverview,
  SmsTestSendResult,
  WhatsAppActionControl,
  WhatsAppAgentAccess,
  WhatsAppDeliveryEvent,
  WhatsAppListingCreationReport,
  WhatsAppOverview,
  WhatsAppTask,
  WhatsAppTemplateCatalog,
  WhatsAppTemplateSyncResult,
  WhatsAppTestSendResult,
} from "@/types/admin";
import type {
  AdminUser,
  GetAdminAuditLogsParams,
  GetAdminUsersParams,
  GetAdminAgentsParams,
  GetAdminEmailEventsParams,
  GetAdminSmsEventsParams,
  GetAdminWhatsAppEventsParams,
  GetAdminWhatsAppAgentAccessParams,
  GetAdminWhatsAppTasksParams,
  GetAdminQueueFailedJobsParams,
  GetAdminLocationsParams,
  GetAdminPropertiesParams,
  GetAdminReferralEventsParams,
  GetAdminCtaInsightsParams,
} from "@/lib/api/admin";

export const adminKeys = {
  overview: () => ["admin", "overview"] as const,
  auditLogs: (params?: GetAdminAuditLogsParams) =>
    ["admin", "audit-logs", params] as const,
  referrals: (params?: GetAdminReferralEventsParams) =>
    ["admin", "referrals", params] as const,
  ctaInsights: (params?: GetAdminCtaInsightsParams) =>
    ["admin", "cta-insights", params] as const,
  referralProgram: () => ["admin", "referrals", "program"] as const,
  agentVerificationSettings: () => ["admin", "agent-verification-settings"] as const,
  listingFreshnessPolicy: () => ["admin", "listing-freshness-policy"] as const,
  users: (params?: GetAdminUsersParams) => ["admin", "users", params] as const,
  agents: (params?: GetAdminAgentsParams) => ["admin", "agents", params] as const,
  agentActivationCandidates: (search?: string) =>
    ["admin", "agent-activation-candidates", search] as const,
  agentActivationWorkspace: (id: string) =>
    ["admin", "agent-activation-workspace", id] as const,
  properties: (params?: GetAdminPropertiesParams) =>
    ["admin", "properties", params] as const,
  locations: (params?: GetAdminLocationsParams) =>
    ["admin", "locations", params] as const,
  propertyTypes: () => ["admin", "property-types"] as const,
  feeTypes: () => ["admin", "fee-types"] as const,
  emailProviders: () => ["admin", "email-providers"] as const,
  emailNotifications: () => ["admin", "email-notifications"] as const,
  workflowDigestSchedule: () => ["admin", "workflow-digest-schedule"] as const,
  emailHealth: () => ["admin", "email-health"] as const,
  smsOverview: () => ["admin", "sms-overview"] as const,
  queueHealth: () => ["admin", "queue-health"] as const,
  queueFailedJobs: (queueName?: ManagedQueueName, params?: GetAdminQueueFailedJobsParams) =>
    ["admin", "queue-failed-jobs", queueName, params] as const,
  emailEvents: (params?: GetAdminEmailEventsParams) =>
    ["admin", "email-events", params] as const,
  smsEvents: (params?: GetAdminSmsEventsParams) =>
    ["admin", "sms-events", params] as const,
  whatsappOverview: () => ["admin", "whatsapp-overview"] as const,
  whatsappEvents: (params?: GetAdminWhatsAppEventsParams) =>
    ["admin", "whatsapp-events", params] as const,
  whatsappTemplates: () => ["admin", "whatsapp-templates"] as const,
  whatsappActionControls: () => ["admin", "whatsapp-action-controls"] as const,
  whatsappAgentAccess: (params?: GetAdminWhatsAppAgentAccessParams) =>
    ["admin", "whatsapp-agent-access", params] as const,
  whatsappTasks: (params?: GetAdminWhatsAppTasksParams) =>
    ["admin", "whatsapp-tasks", params] as const,
  whatsappListingCreationReport: () =>
    ["admin", "whatsapp-listing-creation-report"] as const,
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

export function useAdminCtaInsights(
  params?: GetAdminCtaInsightsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminCtaInsightEvent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.ctaInsights(params),
    queryFn: () => adminApi.getCtaInsights(params),
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

export function useAdminAgentVerificationSettings(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AgentVerificationSettings>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.agentVerificationSettings(),
    queryFn: () => adminApi.getAgentVerificationSettings(),
    ...options,
  });
}

export function useUpdateAdminAgentVerificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateAgentVerificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.agentVerificationSettings() });
      queryClient.invalidateQueries({ queryKey: ["agents", "verification-settings"] });
    },
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

export function useAdminAgentActivationCandidates(
  search?: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminAgentActivationCandidate[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.agentActivationCandidates(search),
    queryFn: () => adminApi.getAgentActivationCandidates(search),
    ...options,
  });
}

export function useAdminAgentActivationWorkspace(
  id: string,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminAgentVerificationWorkspace>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.agentActivationWorkspace(id),
    queryFn: () => adminApi.getAgentActivationWorkspace(id),
    enabled: Boolean(id),
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

export function useUpsertAdminAgentActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        business_name: string;
        business_address: string;
        primary_phone: string;
        whatsapp_same_as_primary_phone: boolean;
        whatsapp_phone?: string | null;
        verification_documents: Array<{
          document_type: string;
          file_name: string;
          content_type: string;
          base64_data: string;
        }>;
        approve?: boolean;
      };
    }) => adminApi.upsertAgentActivation(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.agentActivationWorkspace(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["admin", "agent-activation-candidates"] });
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

export function useAdminFeeTypes(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<FeeType[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.feeTypes(),
    queryFn: () => adminApi.getFeeTypes(),
    ...options,
  });
}

export function useCreateAdminFeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createFeeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.feeTypes() });
      queryClient.invalidateQueries({ queryKey: ["properties", "fee-types"] });
    },
  });
}

export function useUpdateAdminFeeType() {
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
        supports_fixed?: boolean;
        supports_percentage?: boolean;
        is_active?: boolean;
      };
    }) => adminApi.updateFeeType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.feeTypes() });
      queryClient.invalidateQueries({ queryKey: ["properties", "fee-types"] });
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

export function useAdminWorkflowDigestSchedule(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<AdminWorkflowDigestSchedule>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.workflowDigestSchedule(),
    queryFn: () => adminApi.getAdminWorkflowDigestSchedule(),
    ...options,
  });
}

export function useUpdateAdminWorkflowDigestSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateAdminWorkflowDigestSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.workflowDigestSchedule() });
    },
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

export function useAdminSmsOverview(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<SmsOverview>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.smsOverview(),
    queryFn: () => adminApi.getSmsOverview(),
    ...options,
  });
}

export function useAdminQueueHealth(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<QueueHealthReport>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.queueHealth(),
    queryFn: () => adminApi.getQueueHealth(),
    ...options,
  });
}

export function useAdminQueueFailedJobs(
  queueName?: ManagedQueueName,
  params?: GetAdminQueueFailedJobsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<QueueFailedJobSummary[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.queueFailedJobs(queueName, params),
    queryFn: () => {
      if (!queueName) {
        throw new Error("Queue name is required");
      }

      return adminApi.getQueueFailedJobs(queueName, params);
    },
    enabled: Boolean(queueName),
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

export function useAdminSmsEvents(
  params?: GetAdminSmsEventsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<SmsDeliveryEvent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.smsEvents(params),
    queryFn: () => adminApi.getSmsEvents(params),
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

export function useSendAdminTestSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.sendSmsTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sms-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "sms-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

// ── WhatsApp Hooks ──

export function useAdminWhatsAppOverview(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppOverview>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappOverview(),
    queryFn: () => adminApi.getWhatsAppOverview(),
    ...options,
  });
}

export function useAdminWhatsAppEvents(
  params?: GetAdminWhatsAppEventsParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppDeliveryEvent[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappEvents(params),
    queryFn: () => adminApi.getWhatsAppEvents(params),
    ...options,
  });
}

export function useAdminWhatsAppTemplates(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppTemplateCatalog>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappTemplates(),
    queryFn: () => adminApi.getWhatsAppTemplates(),
    ...options,
  });
}

export function useAdminWhatsAppActionControls(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppActionControl[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappActionControls(),
    queryFn: () => adminApi.getWhatsAppActionControls(),
    ...options,
  });
}

export function useAdminWhatsAppAgentAccessList(
  params?: GetAdminWhatsAppAgentAccessParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppAgentAccess[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappAgentAccess(params),
    queryFn: () => adminApi.getWhatsAppAgentAccessList(params),
    ...options,
  });
}

export function useAdminWhatsAppTasks(
  params?: GetAdminWhatsAppTasksParams,
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppTask[]>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappTasks(params),
    queryFn: () => adminApi.getWhatsAppTasks(params),
    ...options,
  });
}

export function useAdminWhatsAppListingCreationReport(
  options?: Omit<
    UseQueryOptions<ApiSuccessResponse<WhatsAppListingCreationReport>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: adminKeys.whatsappListingCreationReport(),
    queryFn: () => adminApi.getWhatsAppListingCreationReport(),
    ...options,
  });
}

export function useSendAdminWhatsAppTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.sendWhatsAppTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useSyncAdminWhatsAppTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<ApiSuccessResponse<WhatsAppTemplateSyncResult>> =>
      adminApi.syncWhatsAppTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.whatsappTemplates() });
      queryClient.invalidateQueries({ queryKey: adminKeys.whatsappOverview() });
      queryClient.invalidateQueries({ queryKey: adminKeys.whatsappEvents() });
    },
  });
}

export function useUpdateAdminWhatsAppActionControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionType,
      data,
    }: {
      actionType: string;
      data: { status: string; paused_reason?: string | null };
    }) => adminApi.updateWhatsAppActionControl(actionType as Parameters<typeof adminApi.updateWhatsAppActionControl>[0], data as Parameters<typeof adminApi.updateWhatsAppActionControl>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-action-controls"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
    },
  });
}

export function useUpdateAdminWhatsAppAgentAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string;
      data: {
        access_status: string;
        enabled_actions?: string[];
        paused_reason?: string | null;
      };
    }) => adminApi.updateWhatsAppAgentAccess(agentId, data as Parameters<typeof adminApi.updateWhatsAppAgentAccess>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-agent-access"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
    },
  });
}

export function useDispatchAdminWhatsAppListingCreation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.dispatchWhatsAppListingCreation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-listing-creation-report"] });
    },
  });
}

export function useDispatchAdminWhatsAppFinalOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.dispatchWhatsAppFinalOutcome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-listing-creation-report"] });
    },
  });
}

export function useRecoverAdminWhatsAppTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => adminApi.recoverWhatsAppTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-listing-creation-report"] });
    },
  });
}

export function useAdminQueueAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      queueName,
      data,
    }: {
      queueName: ManagedQueueName;
      data: {
        action: "pause" | "resume" | "retry-failed" | "retry-job";
        job_id?: string;
        limit?: number;
      };
    }) => adminApi.applyQueueAction(queueName, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "queue-health"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "queue-failed-jobs", variables.queueName] });
      queryClient.invalidateQueries({ queryKey: ["admin", "email-events"] });
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
        label?: string;
        description?: string | null;
        classification?: EmailNotificationSettings["classification"];
        audience_roles?: EmailNotificationSettings["audience_roles"];
        is_user_configurable?: boolean;
        is_enabled?: boolean;
        provider_override?: EmailNotificationSettings["provider_override"];
        subject_template?: string | null;
        preheader_template?: string | null;
        html_template?: string | null;
        text_template?: string | null;
        draft_subject_template?: string | null;
        draft_preheader_template?: string | null;
        draft_html_template?: string | null;
        draft_text_template?: string | null;
        template_mappings?: Record<string, unknown>;
        sample_data?: Record<string, unknown>;
        variable_definitions?: EmailNotificationSettings["variable_definitions"];
        paused_until?: string | null;
        pause_reason?: string | null;
        publish_changes?: boolean;
      };
    }) => adminApi.updateEmailNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email-notifications"] });
    },
  });
}