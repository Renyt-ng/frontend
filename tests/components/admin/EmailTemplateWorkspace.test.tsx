import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EmailTemplateWorkspace } from "@/components/admin/EmailTemplateWorkspace";
import type { EmailNotificationSettings } from "@/types";

const notification: EmailNotificationSettings = {
  id: "notification-1",
  category: "listing_freshness_reminder",
  label: "Listing freshness reminder",
  description: "Reminds an agent to confirm listing availability.",
  classification: "optional",
  audience_roles: ["agent"],
  is_user_configurable: true,
  is_enabled: true,
  provider_override: null,
  subject_template: "Confirm availability for {{propertyTitle}}",
  preheader_template: "This listing needs attention.",
  html_template: "<p>Hello {{fullName}}</p>",
  text_template: "Hello {{fullName}}",
  draft_subject_template: "Confirm availability for {{propertyTitle}}",
  draft_preheader_template: "This listing needs attention.",
  draft_html_template: "<p>Hello {{fullName}}</p>",
  draft_text_template: "Hello {{fullName}}",
  template_mappings: {},
  sample_data: { fullName: "Ada", propertyTitle: "Lekki apartment" },
  variable_definitions: [
    {
      key: "fullName",
      label: "Full name",
      description: "Recipient display name.",
      required: false,
    },
  ],
  paused_until: null,
  pause_reason: null,
  last_published_at: null,
  updated_by: null,
  created_at: "2026-03-29T00:00:00.000Z",
  updated_at: "2026-03-29T00:00:00.000Z",
};

describe("EmailTemplateWorkspace", () => {
  it("inserts variables into the active field", () => {
    render(
      <EmailTemplateWorkspace
        notifications={[notification]}
        isSaving={false}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const subject = screen.getByDisplayValue("Confirm availability for {{propertyTitle}}");
    fireEvent.focus(subject);
    fireEvent.change(subject, { target: { value: "Hello " } });
    fireEvent.click(screen.getByRole("button", { name: "{{fullName}}" }));

    expect(screen.getByDisplayValue("Hello {{fullName}}")).toBeInTheDocument();
  }, 15000);

  it("publishes draft changes through the update callback", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <EmailTemplateWorkspace
        notifications={[notification]}
        isSaving={false}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Confirm availability for {{propertyTitle}}"), {
      target: { value: "Updated subject" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /publish changes/i })[0]);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        "notification-1",
        expect.objectContaining({
          draft_subject_template: "Updated subject",
          publish_changes: true,
        }),
      );
    });
  }, 15000);
});