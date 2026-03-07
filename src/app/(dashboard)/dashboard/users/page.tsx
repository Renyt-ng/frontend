"use client";

import { useState } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from "@/components/ui";
import { Avatar } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import type { Profile, UserRole } from "@/types";

/** Placeholder user list — replaced by real API data when backend is connected */
const PLACEHOLDER_USERS: (Profile & { status: "active" | "suspended" })[] = [];

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users] = useState(PLACEHOLDER_USERS);

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (
      searchQuery &&
      !u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          User Management
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          View and manage all platform users.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
          </div>
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          options={[
            { value: "", label: "All Roles" },
            { value: "admin", label: "Admin" },
            { value: "agent", label: "Agent" },
            { value: "tenant", label: "Tenant" },
          ]}
        />
      </div>

      {/* Users List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No Users Found"
          description={
            searchQuery || roleFilter
              ? "No users match your search criteria."
              : "No users registered yet. Users will appear here once they sign up."
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={user.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--color-text-primary)]">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-[var(--color-text-secondary)]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          user.role === "admin"
                            ? "info"
                            : user.role === "agent"
                              ? "active"
                              : "default"
                        }
                        size="sm"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          user.status === "active" ? "active" : "rejected"
                        }
                        size="sm"
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {new Date(user.created_at).toLocaleDateString("en-NG")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
