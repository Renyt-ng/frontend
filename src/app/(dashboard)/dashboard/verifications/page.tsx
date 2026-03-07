"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { EmptyState } from "@/components/shared";

type VerificationType = "agents" | "properties";

/** Tab selector */
function TabBar({
  active,
  onChange,
}: {
  active: VerificationType;
  onChange: (tab: VerificationType) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-gray-50 p-1">
      {[
        { key: "agents" as const, label: "Agent Verifications", icon: Users },
        {
          key: "properties" as const,
          label: "Property Verifications",
          icon: Building2,
        },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active === key
              ? "bg-white text-[var(--color-deep-slate-blue)] shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function VerificationsPage() {
  const [activeTab, setActiveTab] = useState<VerificationType>("agents");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Verification Queue
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Review and approve agent registrations and property listings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-[var(--color-pending)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pending Review
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-emerald)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Approved Today
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="h-5 w-5 text-[var(--color-rejected)]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Rejected Today
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {activeTab === "agents" ? (
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="No Pending Agent Verifications"
          description="All agent applications have been reviewed. New submissions will appear here."
        />
      ) : (
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="No Pending Property Verifications"
          description="All property listings have been reviewed. New submissions will appear here."
        />
      )}
    </div>
  );
}
