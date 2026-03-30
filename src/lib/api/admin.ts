import apiClient from "./client";
import type {
  Agent,
  AdminReferralEvent,
  AvatarReviewStatus,
  Location,
  LocationKind,
  ListingFreshnessPolicy,
  Property,
  Profile,
  ReferralCampaign,
  ReferralClosureStatus,
  ReferralCommissionBasisSource,
  ReferralCommissionType,
  ReferralEventStatus,
  ReferralProgramAdminConfig,
  ReferralProgramSettings,
  VerificationStatus,
  PropertyVerificationStatus,
  ApiSuccessResponse,
  PropertyTypeDefinition,
} from "@/types";
import type {
  AdminAuditLog,
  EmailDeliveryEvent,
  AdminOverview,
  EmailHealthReport,
  EmailNotificationSettings,
  EmailProviderSettings,
  ManagedQueueName,
  QueueActionName,
  QueueActionResult,
  QueueFailedJobSummary,
  EmailTestSendResult,
  QueueHealthReport,
} from "@/types/admin";

export interface AdminUser extends Profile {
  status: "active" | "suspended";
}

export interface GetAdminUsersParams {
  role?: "admin" | "agent" | "tenant";
  status?: "active" | "suspended";
  search?: string;
}

export interface GetAdminAgentsParams {
  verification_status?: VerificationStatus;
}

export interface GetAdminPropertiesParams {
  status?:
    | "active"
    | "archived"
    | "unavailable"
    | "confirmation_due"
    | "rented_renyt"
    | "rented_off_platform"
    | "sold_renyt"
    | "sold_off_platform";
  verification_status?: PropertyVerificationStatus;
  agent_id?: string;
}

export interface GetAdminAuditLogsParams {
  entity_type?: string;
  action?: string;
  search?: string;
  limit?: number;
}

export interface GetAdminLocationsParams {
  kind?: LocationKind;
  is_active?: boolean;
  search?: string;
}

export interface GetAdminEmailEventsParams {
  provider?: string;
  event_status?: string;
  search?: string;
  limit?: number;
}

export interface GetAdminQueueFailedJobsParams {
  limit?: number;
}

export interface GetAdminReferralEventsParams {
  status?: ReferralEventStatus;
  search?: string;
  limit?: number;
}

/** List users for the admin dashboard */
export async function getUsers(params?: GetAdminUsersParams) {
  const res = await apiClient.get<ApiSuccessResponse<AdminUser[]>>(
    "/admin/users",
    { params },
  );
  return res.data;
}

/** Approve or reject an agent */
export async function updateAgentStatus(
  id: string,
  verification_status: Extract<VerificationStatus, "approved" | "rejected">,
) {
  const res = await apiClient.patch<ApiSuccessResponse<Agent>>(
    `/admin/agents/${id}`,
    { verification_status },
  );
  return res.data;
}

/** Verify or reject a property listing */
export async function verifyProperty(
  id: string,
  verification_status: Extract<PropertyVerificationStatus, "approved" | "rejected">,
) {
  const res = await apiClient.patch<ApiSuccessResponse<Property>>(
    `/admin/properties/${id}/verify`,
    { verification_status },
  );
  return res.data;
}

/** Suspend a user */
export async function suspendUser(id: string) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    `/admin/users/${id}/suspend`,
  );
  return res.data;
}

/** Restore a suspended user */
export async function restoreUser(id: string) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    `/admin/users/${id}/restore`,
  );
  return res.data;
}

export async function updateUserAvatarReview(
  id: string,
  data: {
    avatar_review_status: Exclude<AvatarReviewStatus, "pending">;
    avatar_review_note?: string | null;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<Profile>>(
    `/admin/users/${id}/avatar-review`,
    data,
  );
  return res.data;
}

export async function getAgents(params?: GetAdminAgentsParams) {
  const res = await apiClient.get<ApiSuccessResponse<Agent[]>>(
    "/admin/agents",
    { params },
  );
  return res.data;
}

export async function getProperties(params?: GetAdminPropertiesParams) {
  const res = await apiClient.get<ApiSuccessResponse<Property[]>>(
    "/admin/properties",
    { params },
  );
  return res.data;
}

export async function getOverview() {
  const res = await apiClient.get<ApiSuccessResponse<AdminOverview>>(
    "/admin/overview",
  );
  return res.data;
}

export async function getAuditLogs(params?: GetAdminAuditLogsParams) {
  const res = await apiClient.get<ApiSuccessResponse<AdminAuditLog[]>>(
    "/admin/audit-logs",
    { params },
  );
  return res.data;
}

export async function getReferralEvents(params?: GetAdminReferralEventsParams) {
  const res = await apiClient.get<ApiSuccessResponse<AdminReferralEvent[]>>(
    "/admin/referrals/events",
    { params },
  );
  return res.data;
}

export async function getReferralProgram() {
  const res = await apiClient.get<ApiSuccessResponse<ReferralProgramAdminConfig>>(
    "/admin/referrals/program",
  );
  return res.data;
}

export async function getListingFreshnessPolicy() {
  const res = await apiClient.get<ApiSuccessResponse<ListingFreshnessPolicy>>(
    "/admin/listing-freshness-policy",
  );
  return res.data;
}

export async function updateListingFreshnessPolicy(
  data: {
    fresh_window_days?: number;
    confirmation_grace_days?: number;
    reminder_start_days?: number;
    reminder_interval_days?: number;
    auto_mark_unavailable?: boolean;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<ListingFreshnessPolicy>>(
    "/admin/listing-freshness-policy",
    data,
  );
  return res.data;
}

export async function updateReferralProgramSettings(
  data: {
    is_enabled?: boolean;
    default_commission_type?: ReferralCommissionType;
    default_commission_value?: number;
    default_basis_source?: ReferralCommissionBasisSource;
    fallback_commission_amount?: number;
    terms_version?: string;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<ReferralProgramSettings>>(
    "/admin/referrals/settings",
    data,
  );
  return res.data;
}

export async function createReferralCampaign(
  data: {
    name: string;
    description?: string | null;
    is_active?: boolean;
    priority?: number;
    property_id?: string | null;
    listing_purpose?: "rent" | "sale" | null;
    area?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    commission_type: ReferralCommissionType;
    commission_value: number;
    commission_basis_source: ReferralCommissionBasisSource;
    fallback_commission_amount?: number;
  },
) {
  const res = await apiClient.post<ApiSuccessResponse<ReferralCampaign>>(
    "/admin/referrals/campaigns",
    data,
  );
  return res.data;
}

export async function updateReferralCampaign(
  id: string,
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
    commission_type?: ReferralCommissionType;
    commission_value?: number;
    commission_basis_source?: ReferralCommissionBasisSource;
    fallback_commission_amount?: number;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<ReferralCampaign>>(
    `/admin/referrals/campaigns/${id}`,
    data,
  );
  return res.data;
}

export async function updateReferralEvent(
  id: string,
  data: {
    status: ReferralEventStatus;
    close_status?: ReferralClosureStatus | null;
    rejection_reason?: string | null;
    admin_note?: string | null;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<AdminReferralEvent>>(
    `/admin/referrals/events/${id}`,
    data,
  );
  return res.data;
}

export async function getPropertyTypes() {
  const res = await apiClient.get<ApiSuccessResponse<PropertyTypeDefinition[]>>(
    "/admin/property-types",
  );
  return res.data;
}

export async function getLocations(params?: GetAdminLocationsParams) {
  const res = await apiClient.get<ApiSuccessResponse<Location[]>>(
    "/admin/locations",
    { params },
  );
  return res.data;
}

export async function createLocation(data: {
  slug: string;
  name: string;
  display_name: string;
  kind: LocationKind;
  parent_name?: string | null;
  aliases?: string[];
  is_active?: boolean;
  sort_order?: number;
  popularity_rank?: number;
}) {
  const res = await apiClient.post<ApiSuccessResponse<Location>>(
    "/admin/locations",
    data,
  );
  return res.data;
}

export async function updateLocation(
  id: string,
  data: {
    slug?: string;
    name?: string;
    display_name?: string;
    kind?: LocationKind;
    parent_name?: string | null;
    aliases?: string[];
    is_active?: boolean;
    sort_order?: number;
    popularity_rank?: number;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<Location>>(
    `/admin/locations/${id}`,
    data,
  );
  return res.data;
}

export async function createPropertyType(data: {
  slug: string;
  label: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}) {
  const res = await apiClient.post<ApiSuccessResponse<PropertyTypeDefinition>>(
    "/admin/property-types",
    data,
  );
  return res.data;
}

export async function updatePropertyType(
  id: string,
  data: {
    label?: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<PropertyTypeDefinition>>(
    `/admin/property-types/${id}`,
    data,
  );
  return res.data;
}

export async function getEmailProviders() {
  const res = await apiClient.get<ApiSuccessResponse<EmailProviderSettings[]>>(
    "/admin/email/providers",
  );
  return res.data;
}

export async function updateEmailProvider(
  id: string,
  data: {
    status?: EmailProviderSettings["status"];
    is_enabled?: boolean;
    is_primary?: boolean;
    fallback_order?: number | null;
    from_email?: string | null;
    from_name?: string | null;
    configuration?: Record<string, unknown>;
    health_metadata?: Record<string, unknown>;
  },
) {
  const res = await apiClient.patch<ApiSuccessResponse<EmailProviderSettings>>(
    `/admin/email/providers/${id}`,
    data,
  );
  return res.data;
}

export async function getEmailNotifications() {
  const res = await apiClient.get<
    ApiSuccessResponse<EmailNotificationSettings[]>
  >("/admin/email/notifications");
  return res.data;
}

export async function getEmailHealth() {
  const res = await apiClient.get<ApiSuccessResponse<EmailHealthReport[]>>(
    "/admin/email/health",
  );
  return res.data;
}

export async function getQueueHealth() {
  const res = await apiClient.get<ApiSuccessResponse<QueueHealthReport>>(
    "/admin/queues/health",
  );
  return res.data;
}

export async function getQueueFailedJobs(
  queueName: ManagedQueueName,
  params?: GetAdminQueueFailedJobsParams,
) {
  const res = await apiClient.get<ApiSuccessResponse<QueueFailedJobSummary[]>>(
    `/admin/queues/${queueName}/failed-jobs`,
    { params },
  );
  return res.data;
}

export async function applyQueueAction(
  queueName: ManagedQueueName,
  data: {
    action: QueueActionName;
    job_id?: string;
    limit?: number;
  },
) {
  const res = await apiClient.post<ApiSuccessResponse<QueueActionResult>>(
    `/admin/queues/${queueName}/actions`,
    data,
  );
  return res.data;
}

export async function getEmailEvents(params?: GetAdminEmailEventsParams) {
  const res = await apiClient.get<ApiSuccessResponse<EmailDeliveryEvent[]>>(
    "/admin/email/events",
    { params },
  );
  return res.data;
}

export async function sendEmailTest(data: {
  recipient_email: string;
  subject?: string | null;
  message?: string | null;
  provider_id?: string | null;
  category?: string | null;
}) {
  const res = await apiClient.post<ApiSuccessResponse<EmailTestSendResult>>(
    "/admin/email/test-send",
    data,
  );
  return res.data;
}

export async function updateEmailNotification(
  id: string,
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
  },
) {
  const res = await apiClient.patch<
    ApiSuccessResponse<EmailNotificationSettings>
  >(`/admin/email/notifications/${id}`, data);
  return res.data;
}
