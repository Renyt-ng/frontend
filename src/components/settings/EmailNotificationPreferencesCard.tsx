"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Gift, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { useUpdateEmailNotificationPreferences } from "@/lib/hooks";
import type { Profile } from "@/types";

type OptionalPreferenceCategory =
  | "listing_freshness_reminder"
  | "referral_status_update";

type PreferenceDefinition = {
  category: OptionalPreferenceCategory;
  label: string;
  description: string;
  helper: string;
  roles: Array<Profile["role"]>;
  icon: LucideIcon;
  defaultEnabled: boolean;
};

const OPTIONAL_PREFERENCE_DEFINITIONS: PreferenceDefinition[] = [
  {
    category: "listing_freshness_reminder",
    label: "Listing freshness reminders",
    description: "Get reminders when one of your listings needs availability confirmation.",
    helper: "Useful if you want a nudge before trusted discovery starts to decay.",
    roles: ["agent"],
    icon: Clock3,
    defaultEnabled: true,
  },
  {
    category: "referral_status_update",
    label: "Referral status updates",
    description: "Get updates when one of your referral events changes status.",
    helper: "Turn this off if you do not want reminder-style referral emails.",
    roles: ["agent", "tenant"],
    icon: Gift,
    defaultEnabled: true,
  },
];

export function EmailNotificationPreferencesCard({ profile }: { profile: Profile | null | undefined }) {
  const updatePreferences = useUpdateEmailNotificationPreferences();
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingCategory, setPendingCategory] = useState<OptionalPreferenceCategory | null>(null);

  const visibleDefinitions = useMemo(() => {
    if (!profile?.role) {
      return [];
    }

    return OPTIONAL_PREFERENCE_DEFINITIONS.filter((definition) =>
      definition.roles.includes(profile.role),
    );
  }, [profile?.role]);

  const [preferences, setPreferences] = useState<Record<OptionalPreferenceCategory, boolean>>({
    listing_freshness_reminder:
      profile?.email_notification_preferences?.listing_freshness_reminder ?? true,
    referral_status_update:
      profile?.email_notification_preferences?.referral_status_update ?? true,
  });

  useEffect(() => {
    setPreferences({
      listing_freshness_reminder:
        profile?.email_notification_preferences?.listing_freshness_reminder ?? true,
      referral_status_update:
        profile?.email_notification_preferences?.referral_status_update ?? true,
    });
  }, [profile?.email_notification_preferences]);

  async function handleToggle(category: OptionalPreferenceCategory, nextValue: boolean) {
    setErrorMessage("");
    const previousValue = preferences[category];
    setPendingCategory(category);
    setPreferences((current) => ({
      ...current,
      [category]: nextValue,
    }));

    try {
      await updatePreferences.mutateAsync({
        [category]: nextValue,
      });
    } catch (error) {
      setPreferences((current) => ({
        ...current,
        [category]: previousValue,
      }));
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update email preferences right now.",
      );
    } finally {
      setPendingCategory(null);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[var(--color-text-primary)]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Email Notifications
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Control optional reminder emails only. Critical account and trust emails stay on automatically in the background.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              Optional
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Optional reminders you can change right now. Mandatory account emails are still delivered, but they are intentionally not shown here.
            </p>
            <div className="mt-4 space-y-3">
              {visibleDefinitions.length ? (
                visibleDefinitions.map((definition) => {
                  const currentValue = preferences[definition.category] ?? definition.defaultEnabled;
                  const isSaving = pendingCategory === definition.category;
                  const Icon = definition.icon;

                  return (
                    <div
                      key={definition.category}
                      className="rounded-[20px] border border-[var(--color-border)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[var(--color-text-primary)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-[var(--color-text-primary)]">{definition.label}</p>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                {isSaving ? "Saving..." : currentValue ? "On" : "Off"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                              {definition.description}
                            </p>
                            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                              {definition.helper}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-label={`Email preference: ${definition.label}`}
                          aria-checked={currentValue}
                          disabled={Boolean(pendingCategory)}
                          onClick={() => void handleToggle(definition.category, !currentValue)}
                          className="inline-flex min-h-11 items-center gap-3 self-start rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-deep-slate-blue)]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                        >
                          <span
                            className={`relative h-6 w-11 rounded-full transition ${currentValue ? "bg-[var(--color-deep-slate-blue)]" : "bg-slate-300"}`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${currentValue ? "left-[22px]" : "left-0.5"}`}
                            />
                          </span>
                          <span>{isSaving ? "Saving" : currentValue ? "Enabled" : "Disabled"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
                  No optional email categories are available for your role right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}