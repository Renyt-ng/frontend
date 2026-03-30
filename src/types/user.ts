import type { EmailNotificationPreferences } from "./admin";

export type UserRole = "admin" | "agent" | "tenant";
export type AvatarReviewStatus = "pending" | "approved" | "flagged";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  avatar_review_status: AvatarReviewStatus;
  avatar_review_note: string | null;
  role: UserRole;
  is_verified?: boolean;
  is_suspended?: boolean;
  suspended_at?: string | null;
  email_notification_preferences?: EmailNotificationPreferences;
  created_at: string;
  updated_at?: string;
}
