import type { PropertyTypeDefinition } from "./property";

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
  | "lease_sent"
  | "lease_fully_signed"
  | "user_suspended"
  | "user_restored"
  | "admin_operational_alert";

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
  is_enabled: boolean;
  provider_override: EmailProvider | null;
  subject_template: string | null;
  template_mappings: Record<string, unknown>;
  paused_until: string | null;
  pause_reason: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminPropertyType = PropertyTypeDefinition;