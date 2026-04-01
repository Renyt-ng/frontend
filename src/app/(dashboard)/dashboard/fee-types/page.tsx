"use client";

import { useState } from "react";
import { BadgePercent, Plus, Save } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import {
  useAdminFeeTypes,
  useCreateAdminFeeType,
  useUpdateAdminFeeType,
} from "@/lib/hooks";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function FeeTypesPage() {
  const feeTypesQuery = useAdminFeeTypes();
  const createFeeType = useCreateAdminFeeType();
  const updateFeeType = useUpdateAdminFeeType();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    supports_fixed: true,
    supports_percentage: true,
  });

  const feeTypes = feeTypesQuery.data?.data ?? [];

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    await createFeeType.mutateAsync({
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)).slice(0, 100),
      description: form.description.trim() || null,
      supports_fixed: form.supports_fixed,
      supports_percentage: form.supports_percentage,
      is_active: true,
    });

    setForm({
      name: "",
      slug: "",
      description: "",
      supports_fixed: true,
      supports_percentage: true,
    });
  }

  async function handleQuickUpdate(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      supports_fixed?: boolean;
      supports_percentage?: boolean;
      is_active?: boolean;
    },
  ) {
    await updateFeeType.mutateAsync({ id, data });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Fee Types
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Manage pricing lines agents can attach to listings across rent and sale flows.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Add Fee Type
          </h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 lg:grid-cols-5">
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug ? current.slug : slugify(event.target.value),
                }))
              }
              placeholder="Fee name"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="slug"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={form.supports_fixed}
                onChange={(event) => setForm((current) => ({ ...current, supports_fixed: event.target.checked }))}
              />
              Fixed
            </label>
            <div className="flex gap-3">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={form.supports_percentage}
                  onChange={(event) => setForm((current) => ({ ...current, supports_percentage: event.target.checked }))}
                />
                Percentage
              </label>
              <Button type="submit" isLoading={createFeeType.isPending}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {feeTypes.map((feeType) => (
          <Card key={feeType.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-deep-slate-blue)]">
                  <BadgePercent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {feeType.name}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {feeType.slug}
                  </p>
                </div>
              </div>

              <input
                defaultValue={feeType.name}
                onBlur={(event) => {
                  const nextValue = event.target.value.trim();
                  if (nextValue && nextValue !== feeType.name) {
                    void handleQuickUpdate(feeType.id, { name: nextValue });
                  }
                }}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />

              <textarea
                defaultValue={feeType.description ?? ""}
                rows={3}
                onBlur={(event) => {
                  const nextValue = event.target.value.trim();
                  if (nextValue !== (feeType.description ?? "")) {
                    void handleQuickUpdate(feeType.id, { description: nextValue || null });
                  }
                }}
                className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={feeType.supports_fixed}
                    onChange={(event) => {
                      void handleQuickUpdate(feeType.id, {
                        supports_fixed: event.target.checked,
                      });
                    }}
                  />
                  Supports fixed amounts
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={feeType.supports_percentage}
                    onChange={(event) => {
                      void handleQuickUpdate(feeType.id, {
                        supports_percentage: event.target.checked,
                      });
                    }}
                  />
                  Supports percentages
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={feeType.is_active}
                    onChange={(event) => {
                      void handleQuickUpdate(feeType.id, {
                        is_active: event.target.checked,
                      });
                    }}
                  />
                  Active in listing forms
                </label>
                <Button variant="ghost" size="sm" disabled={updateFeeType.isPending}>
                  <Save className="h-4 w-4" />
                  Auto-save on edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}