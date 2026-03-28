"use client";

import { useState } from "react";
import {
  ClipboardList,
  Search,
  User,
  Building2,
  FileText,
  ScrollText,
} from "lucide-react";
import { Card, Badge, Select } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import { useAdminAuditLogs } from "@/lib/hooks";
import { formatAuditActor } from "@/lib/adminUtils";

const ACTION_ICONS: Record<string, React.ElementType> = {
  agent_approved: User,
  agent_rejected: User,
  property_approved: Building2,
  property_rejected: Building2,
  application_submitted: FileText,
  application_updated: FileText,
  lease_created: ScrollText,
  lease_signed: ScrollText,
};

const ACTION_COLORS: Record<string, string> = {
  agent_approved: "active",
  agent_rejected: "rejected",
  property_approved: "verified",
  property_rejected: "rejected",
  application_submitted: "pending",
  application_updated: "info",
  lease_created: "info",
  lease_signed: "active",
};

interface AuditEntry {
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

export default function AuditLogPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const logsQuery = useAdminAuditLogs({
    entity_type: entityTypeFilter || undefined,
    search: searchQuery || undefined,
    limit: 100,
  });
  const entries = logsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Audit Log
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Track all admin actions and system events.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search by action or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
          </div>
        </div>
        <Select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          options={[
            { value: "", label: "All Entities" },
            { value: "agents", label: "Agents" },
            { value: "properties", label: "Properties" },
            { value: "applications", label: "Applications" },
            { value: "leases", label: "Leases" },
            { value: "profiles", label: "Users" },
            { value: "email_provider_settings", label: "Email Providers" },
            { value: "email_notification_settings", label: "Email Notifications" },
          ]}
        />
      </div>

      {/* Log Entries */}
      {logsQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Audit log data could not be loaded. Confirm the backend is running and you are signed in as an admin.
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No Audit Entries"
          description={
            searchQuery || entityTypeFilter
              ? "No entries match your filters."
              : "No actions have been logged yet. Activity will appear here as users interact with the platform."
          }
        />
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-border)]">
            {entries.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] ?? ClipboardList;
              const color = (ACTION_COLORS[entry.action] as any) ?? "default";
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{formatAuditActor(entry)}</span>{" "}
                      performed{" "}
                      <Badge variant={color} size="sm">
                        {entry.action.replace(/_/g, " ")}
                      </Badge>{" "}
                      on {entry.entity_type}{" "}
                      <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {entry.entity_id.slice(0, 8)}
                      </span>
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--color-text-secondary)]">
                    {new Date(entry.created_at).toLocaleString("en-NG")}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
