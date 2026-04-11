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

export type SmsProvider = "bulksmsnigeria";

export type SmsProviderStatus =
  | "not_configured"
  | "configured"
  | "sandbox"
  | "degraded";

export type SmsDeliveryEventStatus = "queued" | "sent" | "delivered" | "failed";

export interface SmsBalanceSnapshot {
  balance: number | null;
  currency: string;
  fetched_at: string;
  error: string | null;
}

export interface SmsOverview {
  provider: SmsProvider;
  status: SmsProviderStatus;
  sender_id: string | null;
  base_url: string;
  callback_url: string | null;
  sandbox_mode: boolean;
  balance: SmsBalanceSnapshot;
  recent_summary: {
    total: number;
    sent: number;
    failed: number;
    verification: number;
    tests: number;
    last_sent_at: string | null;
  };
}

export interface SmsDeliveryEvent {
  id: string;
  provider: SmsProvider;
  event_status: SmsDeliveryEventStatus;
  event_type: string;
  recipient_phone: string | null;
  provider_message_id: string | null;
  provider_event_id: string | null;
  source: "system" | "webhook";
  cost: number | null;
  balance_after: number | null;
  currency: string | null;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface SmsTestSendResult {
  provider: SmsProvider;
  provider_message_id: string | null;
  cost: number | null;
  balance: number | null;
  recipient_phone: string;
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

export type WhatsAppProvider = "meta";

export type WhatsAppProviderStatus =
  | "not_configured"
  | "configured"
  | "sandbox"
  | "degraded"
  | "paused";

export type WhatsAppDeliveryEventStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppMessageType =
  | "template"
  | "text"
  | "flow"
  | "interactive"
  | "image"
  | "document"
  | "video"
  | "audio";

export type WhatsAppActionType =
  | "listing_creation"
  | "listing_update"
  | "availability_confirmation"
  | "final_outcome_capture"
  | "operational_prompt";

export type WhatsAppTaskStatus =
  | "pending"
  | "offered"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled"
  | "failed";

export type WhatsAppTaskSourceTrigger =
  | "freshness_policy"
  | "agent_initiated"
  | "admin_prompt"
  | "system_recovery";

export type WhatsAppActionStatus = "enabled" | "paused" | "trial_only" | "paid_only";

export type WhatsAppAgentAccessStatus =
  | "eligible_trial"
  | "eligible_paid"
  | "disabled"
  | "approved_not_enrolled"
  | "suspended";

export interface WhatsAppOverview {
  provider: WhatsAppProvider;
  status: WhatsAppProviderStatus;
  phone_number_id: string | null;
  display_phone_number: string | null;
  waba_id: string | null;
  webhook_configured: boolean;
  balance: {
    credit_balance: number | null;
    currency: string;
    fetched_at: string;
    error: string | null;
  };
  action_summary: {
    total_enabled: number;
    total_paused: number;
    total_agents_enrolled: number;
  };
  recent_summary: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    last_sent_at: string | null;
  };
}

export interface WhatsAppDeliveryEvent {
  id: string;
  provider: WhatsAppProvider;
  event_status: WhatsAppDeliveryEventStatus;
  event_type: string;
  message_type: WhatsAppMessageType | null;
  recipient_phone: string | null;
  agent_id: string | null;
  provider_message_id: string | null;
  provider_event_id: string | null;
  template_name: string | null;
  source: "system" | "webhook";
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface WhatsAppTestSendResult {
  provider: WhatsAppProvider;
  provider_message_id: string | null;
  recipient_phone: string;
}

export interface WhatsAppActionControl {
  id: string;
  action_type: WhatsAppActionType;
  status: WhatsAppActionStatus;
  paused_reason: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface WhatsAppAgentAccess {
  id: string;
  agent_id: string;
  access_status: WhatsAppAgentAccessStatus;
  enabled_actions: WhatsAppActionType[];
  trial_started_at: string | null;
  trial_expires_at: string | null;
  paused_reason: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
  business_name?: string | null;
  primary_phone?: string | null;
  whatsapp_phone?: string | null;
  verification_status?: string | null;
}

export interface WhatsAppTask {
  id: string;
  agent_id: string;
  action_type: WhatsAppActionType;
  entity_type: "property";
  entity_id: string | null;
  status: WhatsAppTaskStatus;
  source_trigger: WhatsAppTaskSourceTrigger;
  priority: number;
  payload_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
  current_step: string | null;
  offered_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  last_inbound_message_id: string | null;
  last_outbound_message_id: string | null;
  failure_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTaskDispatchResult {
  mode: string;
  task: WhatsAppTask;
  agent_id: string;
  recipient_phone: string;
  property_id: string | null;
}

export interface WhatsAppListingCreationReport {
  flow_version: string;
  summary: {
    active_tasks: number;
    offered_tasks: number;
    in_progress_tasks: number;
    completed_tasks: number;
    stale_tasks: number;
    reminders_sent_last_24h: number;
    publish_ready_drafts: number;
  };
  step_breakdown: Array<{ step: string; count: number }>;
  charts: {
    age_buckets: Array<{ label: string; count: number }>;
    reminder_distribution: Array<{ label: string; count: number }>;
    pending_field_hotspots: Array<{ field: string; count: number }>;
  };
  stale_drafts: Array<{
    task_id: string;
    agent_id: string;
    property_id: string | null;
    property_title: string | null;
    current_step: string | null;
    next_recommended_step: string | null;
    pending_fields: string[];
    uploaded_image_count: number;
    age_hours: number;
    reminder_count: number;
    last_reminder_sent_at: string | null;
    updated_at: string;
  }>;
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