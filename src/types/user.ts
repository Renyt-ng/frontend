export type UserRole = "admin" | "agent" | "tenant";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}
