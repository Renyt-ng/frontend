"use client";

import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, Camera, Save } from "lucide-react";
import { Card, CardContent, Button, Avatar } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { ProfileAvatarCropModal } from "@/components/profile/ProfileAvatarCropModal";
import { EmailNotificationPreferencesCard } from "@/components/settings/EmailNotificationPreferencesCard";
import { useProfile, useUpdateProfile, useUploadProfileAvatar } from "@/lib/hooks";
import { validateProfileAvatarFile } from "@/lib/profileAvatar";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadProfileAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const roleLabel =
    user?.role === "admin" ? "Admin" : user?.role === "agent" ? "Agent" : "User";
  const [avatarError, setAvatarError] = useState("");
  const [serverError, setServerError] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const profile = profileQuery.data?.data ?? user;
  const initialFullName = profile?.full_name ?? "";
  const initialPhone = profile?.phone ?? "";
  const hasProfileChanges =
    fullName !== initialFullName ||
    phone !== initialPhone;

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profileQuery.data?.data, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        phone: phone || null,
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not save profile changes",
      );
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateProfileAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      event.target.value = "";
      return;
    }

    setAvatarError("");
    setServerError("");
    setPendingAvatarFile(file);
    event.target.value = "";
  }

  async function handleCropConfirm(payload: {
    file_name: string;
    content_type: string;
    base64_data: string;
  }) {
    try {
      await uploadAvatar.mutateAsync(payload);
      setPendingAvatarFile(null);
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Could not upload profile photo",
      );
    }
  }

  const isAgent = profile?.role === "agent";
  const headshotStatus = profile?.avatar_review_status ?? "pending";
  const headshotNote = profile?.avatar_review_note?.trim() ?? "";

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

          {serverError && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={profile?.avatar_url ?? null}
                fallback={profile?.full_name ?? "User"}
                size="lg"
                className="h-20 w-20 text-lg"
              />
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadAvatar.isPending}
                >
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  JPG, PNG, or WebP. Max 5MB.
                </p>
                {isAgent && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Agents must upload a professional headshot on a plain white background before submitting verification.
                  </div>
                )}
                {profile?.avatar_url && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Headshot review:
                    </span>
                    <StatusBadge status={headshotStatus} size="sm" />
                  </div>
                )}
                {headshotStatus === "flagged" && headshotNote && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
                    <p className="font-medium">Update required</p>
                    <p className="mt-1">{headshotNote}</p>
                  </div>
                )}
                {headshotStatus === "pending" && profile?.avatar_url && isAgent && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[var(--color-deep-slate-blue)]">
                    Your latest headshot is pending admin review.
                  </div>
                )}
                {avatarError && (
                  <p className="mt-2 text-sm text-[var(--color-rejected)]">{avatarError}</p>
                )}
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
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
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
                    defaultValue={user?.email ?? ""}
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
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
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
                  value={roleLabel}
                  disabled
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-gray-50 px-4 text-sm text-[var(--color-text-secondary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={updateProfile.isPending}
                disabled={!hasProfileChanges}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EmailNotificationPreferencesCard profile={profile} />

      <ProfileAvatarCropModal
        isOpen={Boolean(pendingAvatarFile)}
        file={pendingAvatarFile}
        isSubmitting={uploadAvatar.isPending}
        onClose={() => setPendingAvatarFile(null)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
