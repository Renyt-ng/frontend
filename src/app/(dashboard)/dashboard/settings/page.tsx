"use client";

import { useState } from "react";
import { User, Mail, Phone, Camera, Save } from "lucide-react";
import { Card, CardContent, Button, Avatar } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    // TODO: integrate with authApi.updateProfile()
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your profile and account settings.
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
            Profile Information
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar fallback={user?.full_name ?? "User"} size="lg" />
              <div>
                <Button variant="secondary" size="sm" type="button">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    defaultValue={user?.full_name}
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-gray-50 pl-10 pr-4 text-sm text-[var(--color-text-secondary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="tel"
                    defaultValue={user?.phone ?? ""}
                    placeholder="+234 800 000 0000"
                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role ?? "tenant"}
                  disabled
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-gray-50 px-4 text-sm capitalize text-[var(--color-text-secondary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSaving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
