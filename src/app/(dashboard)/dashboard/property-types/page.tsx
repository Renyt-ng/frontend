"use client";

import { useState } from "react";
import { Layers3, Plus, Save } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import {
  useAdminPropertyTypes,
  useCreateAdminPropertyType,
  useUpdateAdminPropertyType,
} from "@/lib/hooks";

export default function PropertyTypesPage() {
  const propertyTypesQuery = useAdminPropertyTypes();
  const createPropertyType = useCreateAdminPropertyType();
  const updatePropertyType = useUpdateAdminPropertyType();
  const [form, setForm] = useState({
    slug: "",
    label: "",
    description: "",
    sort_order: "0",
  });

  const propertyTypes = propertyTypesQuery.data?.data ?? [];

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    await createPropertyType.mutateAsync({
      slug: form.slug.trim(),
      label: form.label.trim(),
      description: form.description.trim() || null,
      sort_order: Number(form.sort_order),
      is_active: true,
    });
    setForm({ slug: "", label: "", description: "", sort_order: "0" });
  }

  async function handleQuickUpdate(
    id: string,
    data: {
      label?: string;
      description?: string | null;
      is_active?: boolean;
      sort_order?: number;
    },
  ) {
    await updatePropertyType.mutateAsync({ id, data });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Property Types
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Manage listing taxonomy used across property creation and search.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Add Property Type
          </h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 lg:grid-cols-4">
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="slug"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="Label"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <div className="flex gap-3">
              <input
                value={form.sort_order}
                onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                placeholder="Order"
                className="h-12 w-24 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />
              <Button type="submit" isLoading={createPropertyType.isPending}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {propertyTypes.map((propertyType) => (
          <Card key={propertyType.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-deep-slate-blue)]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {propertyType.label}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {propertyType.slug}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  defaultValue={propertyType.label}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    if (nextValue && nextValue !== propertyType.label) {
                      void handleQuickUpdate(propertyType.id, { label: nextValue });
                    }
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={propertyType.sort_order}
                  onBlur={(event) => {
                    const normalized = event.target.value.replace(/\D/g, "").trim();
                    if (!normalized) {
                      event.target.value = String(propertyType.sort_order);
                      return;
                    }

                    const nextValue = Number(normalized);
                    if (!Number.isNaN(nextValue) && nextValue !== propertyType.sort_order) {
                      void handleQuickUpdate(propertyType.id, { sort_order: nextValue });
                    }
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>

              <textarea
                defaultValue={propertyType.description ?? ""}
                rows={3}
                onBlur={(event) => {
                  const nextValue = event.target.value.trim();
                  if (nextValue !== (propertyType.description ?? "")) {
                    void handleQuickUpdate(propertyType.id, {
                      description: nextValue || null,
                    });
                  }
                }}
                className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={propertyType.is_active}
                    onChange={(event) => {
                      void handleQuickUpdate(propertyType.id, {
                        is_active: event.target.checked,
                      });
                    }}
                  />
                  Active in listing forms
                </label>
                <Button variant="ghost" size="sm" disabled={updatePropertyType.isPending}>
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