import { describe, expect, it } from "vitest";
import {
  formatEmailEventStatus,
  formatEmailProvider,
  formatQueueConditionState,
  formatQueueHealthStatus,
  formatQueueName,
  getProviderConfigurationPlaceholder,
  getEmailEventBadgeVariant,
  getQueueConditionBadgeVariant,
  getQueueHealthBadgeVariant,
  getProviderBadgeVariant,
  sortProviders,
} from "@/lib/adminUtils";

describe("adminUtils", () => {
  it("formats provider labels", () => {
    expect(formatEmailProvider("ses")).toBe("Amazon SES");
    expect(formatEmailProvider("brevo")).toBe("Brevo");
  });

  it("maps provider statuses to badge variants", () => {
    expect(getProviderBadgeVariant("primary")).toBe("active");
    expect(getProviderBadgeVariant("fallback")).toBe("info");
    expect(getProviderBadgeVariant("degraded")).toBe("pending");
  });

  it("sorts primary then fallback providers", () => {
    const sorted = sortProviders([
      {
        id: "2",
        provider: "mailgun",
        status: "fallback",
        is_enabled: true,
        is_primary: false,
        fallback_order: 2,
        from_email: null,
        from_name: null,
        configuration: {},
        health_metadata: {},
        last_tested_at: null,
        last_healthcheck_at: null,
        created_by: null,
        updated_by: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "1",
        provider: "ses",
        status: "primary",
        is_enabled: true,
        is_primary: true,
        fallback_order: null,
        from_email: null,
        from_name: null,
        configuration: {},
        health_metadata: {},
        last_tested_at: null,
        last_healthcheck_at: null,
        created_by: null,
        updated_by: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        provider: "brevo",
        status: "fallback",
        is_enabled: true,
        is_primary: false,
        fallback_order: 1,
        from_email: null,
        from_name: null,
        configuration: {},
        health_metadata: {},
        last_tested_at: null,
        last_healthcheck_at: null,
        created_by: null,
        updated_by: null,
        created_at: "",
        updated_at: "",
      },
    ]);

    expect(sorted.map((provider) => provider.provider)).toEqual([
      "ses",
      "brevo",
      "mailgun",
    ]);
  });

  it("formats email delivery statuses", () => {
    expect(formatEmailEventStatus("webhook_received")).toBe("webhook received");
  });

  it("maps email delivery statuses to badge variants", () => {
    expect(getEmailEventBadgeVariant("delivered")).toBe("active");
    expect(getEmailEventBadgeVariant("queued")).toBe("info");
    expect(getEmailEventBadgeVariant("failed")).toBe("pending");
  });

  it("returns provider-specific configuration placeholders", () => {
    expect(getProviderConfigurationPlaceholder("mailgun")).toContain(
      '"webhook_signing_key"',
    );
    expect(getProviderConfigurationPlaceholder("brevo")).toContain(
      '"webhook_secret"',
    );
  });

  it("formats queue diagnostics helpers", () => {
    expect(formatQueueHealthStatus("degraded")).toBe("Degraded");
    expect(getQueueHealthBadgeVariant("healthy")).toBe("dashboardSuccess");
    expect(getQueueConditionBadgeVariant("unmet")).toBe("pending");
    expect(formatQueueConditionState("unverified")).toBe("Needs check");
    expect(formatQueueName("property-publish")).toBe("Property Publish");
  });
});