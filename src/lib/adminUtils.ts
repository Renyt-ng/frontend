import type {
  AdminAuditLog,
  EmailDeliveryEventStatus,
  EmailProvider,
  EmailProviderSettings,
  EmailProviderStatus,
  QueueConditionState,
  QueueHealthStatus,
  SmsDeliveryEventStatus,
  SmsProvider,
  SmsProviderStatus,
  WhatsAppActionStatus,
  WhatsAppAgentAccessStatus,
  WhatsAppDeliveryEventStatus,
  WhatsAppProvider,
  WhatsAppProviderStatus,
} from "@/types/admin";

export function formatEmailProvider(provider: EmailProvider) {
  switch (provider) {
    case "ses":
      return "Amazon SES";
    case "brevo":
      return "Brevo";
    case "mailgun":
      return "Mailgun";
  }
}

export function getProviderBadgeVariant(status: EmailProviderStatus) {
  switch (status) {
    case "primary":
    case "configured":
      return "active" as const;
    case "fallback":
      return "info" as const;
    case "degraded":
    case "needs_verification":
      return "pending" as const;
    case "paused":
      return "default" as const;
    case "not_configured":
      return "default" as const;
  }
}

export function sortProviders(providers: EmailProviderSettings[]) {
  return [...providers].sort((left, right) => {
    if (left.is_primary !== right.is_primary) {
      return left.is_primary ? -1 : 1;
    }

    if (left.fallback_order !== right.fallback_order) {
      if (left.fallback_order === null) return 1;
      if (right.fallback_order === null) return -1;
      return left.fallback_order - right.fallback_order;
    }

    return left.provider.localeCompare(right.provider);
  });
}

export function formatAuditActor(entry: AdminAuditLog) {
  return entry.profiles?.full_name ?? "System";
}

export function formatEmailEventStatus(status: EmailDeliveryEventStatus) {
  return status.replace(/_/g, " ");
}

export function getEmailEventBadgeVariant(status: EmailDeliveryEventStatus) {
  switch (status) {
    case "sent":
    case "delivered":
    case "opened":
    case "clicked":
      return "active" as const;
    case "queued":
    case "deferred":
    case "webhook_received":
      return "info" as const;
    case "bounced":
    case "complained":
    case "failed":
      return "pending" as const;
  }
}

export function getProviderConfigurationPlaceholder(provider: EmailProvider) {
  switch (provider) {
    case "ses":
      return JSON.stringify(
        {
          region: "us-east-1",
          access_key_id: "AKIAIOSFODNN7EXAMPLE",
          secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          configuration_set: "renyt-transactional",
        },
        null,
        2,
      );
    case "brevo":
      return JSON.stringify(
        {
          api_key: "xkeysib-1234567890abcdef1234567890abcdef1234567890abcdef",
          sender_id: "optional-sender-id",
          webhook_secret: "brevo-webhook-secret",
        },
        null,
        2,
      );
    case "mailgun":
      return JSON.stringify(
        {
          api_key: "key-1234567890abcdef1234567890abcdef",
          domain: "mg.example.com",
          region: "eu",
          webhook_signing_key: "mailgun-webhook-signing-key",
        },
        null,
        2,
      );
  }
}

export function formatQueueHealthStatus(status: QueueHealthStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getQueueHealthBadgeVariant(status: QueueHealthStatus) {
  switch (status) {
    case "healthy":
      return "dashboardSuccess" as const;
    case "degraded":
      return "dashboardWarning" as const;
    case "down":
      return "dashboardCritical" as const;
  }
}

export function getQueueConditionBadgeVariant(state: QueueConditionState) {
  switch (state) {
    case "met":
      return "active" as const;
    case "unmet":
      return "pending" as const;
    case "unverified":
      return "info" as const;
  }
}

export function formatQueueConditionState(state: QueueConditionState) {
  switch (state) {
    case "met":
      return "Met";
    case "unmet":
      return "Unmet";
    case "unverified":
      return "Needs check";
  }
}

export function formatQueueName(name: string) {
  return name
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatSmsProvider(provider: SmsProvider) {
  switch (provider) {
    case "bulksmsnigeria":
      return "BulkSMSNigeria";
  }
}

export function formatSmsProviderStatus(status: SmsProviderStatus) {
  return status.replace(/_/g, " ");
}

export function getSmsProviderBadgeVariant(status: SmsProviderStatus) {
  switch (status) {
    case "configured":
    case "sandbox":
      return "active" as const;
    case "degraded":
      return "pending" as const;
    case "not_configured":
      return "default" as const;
  }
}

export function formatSmsEventStatus(status: SmsDeliveryEventStatus) {
  return status.replace(/_/g, " ");
}

export function getSmsEventBadgeVariant(status: SmsDeliveryEventStatus) {
  switch (status) {
    case "sent":
    case "delivered":
      return "active" as const;
    case "queued":
      return "info" as const;
    case "failed":
      return "pending" as const;
  }
}

// ── WhatsApp Helpers ──

export function formatWhatsAppProvider(provider: WhatsAppProvider) {
  switch (provider) {
    case "meta":
      return "Meta Cloud API";
  }
}

export function formatWhatsAppProviderStatus(status: WhatsAppProviderStatus) {
  return status.replace(/_/g, " ");
}

export function getWhatsAppProviderBadgeVariant(status: WhatsAppProviderStatus) {
  switch (status) {
    case "configured":
    case "sandbox":
      return "active" as const;
    case "degraded":
    case "paused":
      return "pending" as const;
    case "not_configured":
      return "default" as const;
  }
}

export function formatWhatsAppEventStatus(status: WhatsAppDeliveryEventStatus) {
  return status.replace(/_/g, " ");
}

export function getWhatsAppEventBadgeVariant(status: WhatsAppDeliveryEventStatus) {
  switch (status) {
    case "sent":
    case "delivered":
    case "read":
      return "active" as const;
    case "queued":
      return "info" as const;
    case "failed":
      return "pending" as const;
  }
}

export function formatWhatsAppActionStatus(status: WhatsAppActionStatus) {
  return status.replace(/_/g, " ");
}

export function getWhatsAppActionBadgeVariant(status: WhatsAppActionStatus) {
  switch (status) {
    case "enabled":
      return "active" as const;
    case "paused":
      return "pending" as const;
    case "trial_only":
    case "paid_only":
      return "info" as const;
  }
}

export function formatWhatsAppAgentAccessStatus(status: WhatsAppAgentAccessStatus) {
  return status.replace(/_/g, " ");
}

export function getWhatsAppAgentAccessBadgeVariant(status: WhatsAppAgentAccessStatus) {
  switch (status) {
    case "eligible_trial":
    case "eligible_paid":
      return "active" as const;
    case "approved_not_enrolled":
      return "info" as const;
    case "disabled":
    case "suspended":
      return "pending" as const;
  }
}