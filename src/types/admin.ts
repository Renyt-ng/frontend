import type { FeeType, PropertyTypeDefinition } from "./property";

export type EmailProvider = "ses" | "brevo" | "mailgun";

export type EmailProviderStatus =
  | "not_configured"
  | "configured"
  | "primary"
  | "fallback"
  | "degraded"
  | "paused"
  | "needs_verification";

export type EmailNotificationCategory =
  | "agent_verification_submitted"
  | "agent_verification_approved"
  | "agent_verification_rejected"
  | "property_verification_approved"
  | "property_verification_rejected"
  | "listing_freshness_reminder"
  | "referral_status_update"
  | "lease_sent"
  | "lease_fully_signed"
  | "user_suspended"
  | "user_restored"
  | "admin_operational_alert"
  | "admin_workflow_alert"
  | "admin_workflow_digest";

export type EmailNotificationClassification =
  | "mandatory"
  | "optional"
  | "operational"
  | "legacy";

export type EmailNotificationAudienceRole = "admin" | "agent" | "tenant";

export type UserConfigurableEmailCategory =
  | "listing_freshness_reminder"
  | "referral_status_update";

export type EmailNotificationPreferences = Partial<
  Record<UserConfigurableEmailCategory, boolean>
>;

export interface EmailTemplateVariableDefinition {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

export interface AdminOverview {
  metrics: {
    total_listings: number;
    pending_verifications: number;
    active_applications: number;
    signed_leases: number;
    suspended_users: number;
  };
  email_health: {
    primary_provider: EmailProvider | null;
    primary_status: EmailProviderStatus | null;
    fallback_ready_count: number;
    degraded_count: number;
  };
  recent_activity: AdminAuditLog[];
}

export interface AdminAuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

export interface EmailProviderSettings {
  id: string;
  provider: EmailProvider;
  status: EmailProviderStatus;
  is_enabled: boolean;
  is_primary: boolean;
  fallback_order: number | null;
  from_email: string | null;
  from_name: string | null;
  configuration: Record<string, unknown>;
  health_metadata: Record<string, unknown>;
  last_tested_at: string | null;
  last_healthcheck_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailHealthReport {
  provider: EmailProvider;
  provider_id: string;
  status: EmailProviderStatus;
  is_enabled: boolean;
  is_primary: boolean;
  fallback_order: number | null;
  issues: string[];
  deliverable: boolean;
  delivery_issues: string[];
  webhook_issues: string[];
  webhook_verifiable: boolean;
  last_tested_at: string | null;
  last_healthcheck_at: string | null;
}

export type QueueHealthStatus = "healthy" | "degraded" | "down";

export type QueueConditionState = "met" | "unmet" | "unverified";

export interface QueueOperationalCondition {
  key: string;
  state: QueueConditionState;
  message: string;
}

export interface QueueSnapshot {
  name: string;
  jobName: string;
  counts: Record<string, number> | null;
  isPaused: boolean | null;
  error: {
    name?: string;
    message?: string;
    stack?: string;
  } | null;
}

export type ManagedQueueName = "property-publish" | "email-notifications";

export type QueueActionName = "pause" | "resume" | "retry-failed" | "retry-job";

export interface QueueFailedJobSummary {
  id: string;
  queueName: ManagedQueueName;
  name: string;
  failedReason: string | null;
  attemptsMade: number;
  attemptsConfigured: number | null;
  timestamp: string | null;
  processedOn: string | null;
  finishedOn: string | null;
  payloadSummary: {
    title: string;
    subtitle: string;
    fields: Array<{
      label: string;
      value: string;
    }>;
  };
  error: {
    name?: string;
    message?: string;
    stack?: string;
  } | null;
}

export interface QueueActionResult {
  queueName: ManagedQueueName;
  action: QueueActionName;
  affectedJobIds: string[];
  queuePaused: boolean | null;
  message: string;
}

export interface QueueHealthReport {
  checkedAt: string;
  status: QueueHealthStatus;
  redis: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number | null;
    queuePrefix: string;
    error: {
      name?: string;
      message?: string;
      stack?: string;
    } | null;
  };
  workerTopology: {
    mode: "embedded" | "external";
    apiStartsWorkers: boolean;
    standaloneWorkerCommand: string;
    publishWorkerConcurrency: number;
    emailWorkerConcurrency: number;
  };
  emailDelivery: {
    providersConfigured: number;
    deliverableProviders: number;
    ready: boolean;
    error: {
      name?: string;
      message?: string;
      stack?: string;
    } | null;
  };
  queues: QueueSnapshot[];
  conditions: QueueOperationalCondition[];
}

export type EmailDeliveryEventStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "deferred"
  | "failed"
  | "opened"
  | "clicked"
  | "webhook_received";

export interface EmailDeliveryEvent {
  id: string;
  provider: EmailProvider;
  category: EmailNotificationCategory | null;
  event_status: EmailDeliveryEventStatus;
  event_type: string;
  recipient_email: string | null;
  provider_message_id: string | null;
  provider_event_id: string | null;
  source: "system" | "webhook";
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface EmailTestSendResult {
  provider: EmailProvider;
  provider_id: string;
  message_id: string | null;
  attempted_providers: Array<{
    provider: EmailProvider;
    provider_id: string;
  }>;
}

export interface EmailNotificationSettings {
  id: string;
  category: EmailNotificationCategory;
  label: string;
  description: string | null;
  classification: EmailNotificationClassification;
  audience_roles: EmailNotificationAudienceRole[];
  is_user_configurable: boolean;
  is_enabled: boolean;
  provider_override: EmailProvider | null;
  subject_template: string | null;
  preheader_template: string | null;
  html_template: string | null;
  text_template: string | null;
  draft_subject_template: string | null;
  draft_preheader_template: string | null;
  draft_html_template: string | null;
  draft_text_template: string | null;
  template_mappings: Record<string, unknown>;
  sample_data: Record<string, unknown>;
  variable_definitions: EmailTemplateVariableDefinition[];
  paused_until: string | null;
  pause_reason: string | null;
  last_published_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminPropertyType = PropertyTypeDefinition;
export type AdminFeeType = FeeType;

export type AdminWorkflowDigestFrequency = "hourly" | "daily";

export interface AdminWorkflowDigestSchedule {
  id: string;
  is_enabled: boolean;
  frequency: AdminWorkflowDigestFrequency;
  hour_utc: number;
  minute_utc: number;
  last_run_at: string | null;
  next_run_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}