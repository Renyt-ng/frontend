"use client";

import { useMemo, useState } from "react";
import { MapPinned, Plus, Save } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import {
  useAdminLocations,
  useCreateAdminLocation,
  useUpdateAdminLocation,
} from "@/lib/hooks";
import type { Location, LocationKind } from "@/types";

function serializeAliases(aliases: string[]) {
  return aliases.join(", ");
}

function parseAliases(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  );
}

export default function LocationsPage() {
  const [filters, setFilters] = useState<{
    kind: LocationKind | "all";
    search: string;
  }>({
    kind: "all",
    search: "",
  });
  const [form, setForm] = useState({
    slug: "",
    name: "",
    display_name: "",
    kind: "area" as LocationKind,
    parent_name: "",
    aliases: "",
    sort_order: "0",
    popularity_rank: "999",
  });

  const locationsQuery = useAdminLocations({
    kind: filters.kind === "all" ? undefined : filters.kind,
    search: filters.search.trim() || undefined,
  });
  const createLocation = useCreateAdminLocation();
  const updateLocation = useUpdateAdminLocation();
  const locations = locationsQuery.data?.data ?? [];

  const lgaOptions = useMemo(
    () => locations.filter((location) => location.kind === "lga"),
    [locations],
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    await createLocation.mutateAsync({
      slug: form.slug.trim(),
      name: form.name.trim(),
      display_name: form.display_name.trim(),
      kind: form.kind,
      parent_name: form.kind === "area" ? form.parent_name || null : null,
      aliases: parseAliases(form.aliases),
      is_active: true,
      sort_order: Number(form.sort_order || 0),
      popularity_rank: Number(form.popularity_rank || 999),
    });

    setForm({
      slug: "",
      name: "",
      display_name: "",
      kind: "area",
      parent_name: "",
      aliases: "",
      sort_order: "0",
      popularity_rank: "999",
    });
  }

  async function handleQuickUpdate(
    id: string,
    data: {
      name?: string;
      display_name?: string;
      kind?: LocationKind;
      parent_name?: string | null;
      aliases?: string[];
      is_active?: boolean;
      sort_order?: number;
      popularity_rank?: number;
    },
  ) {
    await updateLocation.mutateAsync({ id, data });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Locations
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Manage Lagos LGAs, neighbourhoods, and aliases used by search and listing forms.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Add Location
          </h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 lg:grid-cols-4">
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="slug"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Canonical name"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <input
              value={form.display_name}
              onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
              placeholder="Display name"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <select
              value={form.kind}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  kind: event.target.value as LocationKind,
                  parent_name: event.target.value === "lga" ? "" : current.parent_name,
                }))
              }
              className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            >
              <option value="area">Area</option>
              <option value="lga">LGA</option>
            </select>

            <select
              value={form.parent_name}
              onChange={(event) => setForm((current) => ({ ...current, parent_name: event.target.value }))}
              disabled={form.kind !== "area"}
              className="h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">Parent LGA</option>
              {lgaOptions.map((location) => (
                <option key={location.id} value={location.name}>
                  {location.display_name}
                </option>
              ))}
            </select>
            <input
              value={form.aliases}
              onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))}
              placeholder="Aliases, comma separated"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10 lg:col-span-2"
            />
            <input
              value={form.sort_order}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
              placeholder="Order"
              className="h-12 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
            <div className="flex gap-3">
              <input
                value={form.popularity_rank}
                onChange={(event) => setForm((current) => ({ ...current, popularity_rank: event.target.value }))}
                placeholder="Popularity"
                className="h-12 w-28 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />
              <Button type="submit" isLoading={createLocation.isPending}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <select
              value={filters.kind}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  kind: event.target.value as LocationKind | "all",
                }))
              }
              className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            >
              <option value="all">All kinds</option>
              <option value="area">Areas</option>
              <option value="lga">LGAs</option>
            </select>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search locations or aliases"
              className="h-11 min-w-[240px] rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {locations.length} {locations.length === 1 ? "location" : "locations"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-deep-slate-blue)]">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {location.display_name}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {location.slug}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  {location.kind}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  defaultValue={location.name}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    if (nextValue && nextValue !== location.name) {
                      void handleQuickUpdate(location.id, { name: nextValue });
                    }
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
                <input
                  defaultValue={location.display_name}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    if (nextValue && nextValue !== location.display_name) {
                      void handleQuickUpdate(location.id, {
                        display_name: nextValue,
                      });
                    }
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  defaultValue={location.parent_name ?? ""}
                  disabled={location.kind !== "area"}
                  onChange={(event) => {
                    void handleQuickUpdate(location.id, {
                      parent_name: event.target.value || null,
                    });
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">Parent LGA</option>
                  {lgaOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.display_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={location.popularity_rank}
                  onBlur={(event) => {
                    const nextValue = Number(event.target.value.replace(/\D/g, "") || location.popularity_rank);
                    if (!Number.isNaN(nextValue) && nextValue !== location.popularity_rank) {
                      void handleQuickUpdate(location.id, { popularity_rank: nextValue });
                    }
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>

              <input
                defaultValue={serializeAliases(location.aliases)}
                onBlur={(event) => {
                  const nextAliases = parseAliases(event.target.value);
                  if (serializeAliases(nextAliases) !== serializeAliases(location.aliases)) {
                    void handleQuickUpdate(location.id, { aliases: nextAliases });
                  }
                }}
                placeholder="Aliases, comma separated"
                className="h-11 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
              />

              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    defaultValue={location.sort_order}
                    onBlur={(event) => {
                      const nextValue = Number(event.target.value.replace(/\D/g, "") || location.sort_order);
                      if (!Number.isNaN(nextValue) && nextValue !== location.sort_order) {
                        void handleQuickUpdate(location.id, { sort_order: nextValue });
                      }
                    }}
                    className="h-11 w-24 rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={location.is_active}
                      onChange={(event) => {
                        void handleQuickUpdate(location.id, {
                          is_active: event.target.checked,
                        });
                      }}
                    />
                    Active
                  </label>
                </div>
                <Button variant="ghost" size="sm" disabled={updateLocation.isPending}>
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