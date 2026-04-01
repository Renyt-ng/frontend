"use client";

import { useMemo, useState } from "react";
import { Users, Search, Ban, RotateCcw, BadgeCheck, Flag, ShieldCheck } from "lucide-react";
import { Card, Button, Badge, Select, Modal } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import {
  useAdminAgents,
  useAdminUsers,
  useRestoreUser,
  useSuspendUser,
  useUpdateAgentStatus,
  useUpdateUserAvatarReview,
} from "@/lib/hooks";
import type { Agent, Profile, UserRole } from "@/types";

type AdminUser = Profile & { status: "active" | "suspended" };

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const usersQuery = useAdminUsers();
  const agentsQuery = useAdminAgents();
  const suspendUser = useSuspendUser();
  const restoreUser = useRestoreUser();
  const updateAgentStatus = useUpdateAgentStatus();
  const updateUserAvatarReview = useUpdateUserAvatarReview();
  const [flagModalUser, setFlagModalUser] = useState<AdminUser | null>(null);
  const [flagNote, setFlagNote] = useState("");

  const users = usersQuery.data?.data ?? [];
  const agents = agentsQuery.data?.data ?? [];

  const agentsByUserId = useMemo(
    () => new Map(agents.map((agent) => [agent.user_id, agent] satisfies [string, Agent])),
    [agents],
  );

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (
      searchQuery &&
      !u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(u.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const isMutating =
    suspendUser.isPending ||
    restoreUser.isPending ||
    updateAgentStatus.isPending ||
    updateUserAvatarReview.isPending;

  async function handleToggleSuspension(user: AdminUser) {
    if (user.status === "suspended") {
      await restoreUser.mutateAsync(user.id);
      return;
    }

    await suspendUser.mutateAsync(user.id);
  }

  async function handleVerifyAgent(agentId: string) {
    await updateAgentStatus.mutateAsync({
      id: agentId,
      verification_status: "approved",
    });
  }

  async function handleApproveAvatar(userId: string) {
    await updateUserAvatarReview.mutateAsync({
      id: userId,
      data: {
        avatar_review_status: "approved",
        avatar_review_note: null,
      },
    });
  }

  async function handleFlagAvatar() {
    if (!flagModalUser) {
      return;
    }

    await updateUserAvatarReview.mutateAsync({
      id: flagModalUser.id,
      data: {
        avatar_review_status: "flagged",
        avatar_review_note: flagNote,
      },
    });
    setFlagModalUser(null);
    setFlagNote("");
  }

  return (
    <>
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

      {usersQuery.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Could not load users. Confirm you are signed in as an admin and the backend is running.
        </div>
      )}

      {agentsQuery.isError && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-[var(--color-pending)]">
          User records loaded, but agent verification statuses could not be fetched.
        </div>
      )}

      {/* Users List */}
      {usersQuery.isLoading ? (
        <Card>
          <div className="space-y-3 p-6">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </Card>
      ) : filtered.length === 0 ? (
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
          <div className="space-y-4 p-4 lg:hidden">
            {filtered.map((user) => {
              const agentRecord = agentsByUserId.get(user.id);

              return (
                <div
                  key={user.id}
                  className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={user.avatar_url} fallback={user.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {user.full_name}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        {user.email ?? "No email"}
                      </p>
                    </div>
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
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                        Verification
                      </p>
                      <div className="mt-2">
                        {agentRecord ? (
                          <StatusBadge status={agentRecord.verification_status} size="sm" />
                        ) : user.role === "agent" ? (
                          <Badge variant="default" size="sm">
                            No application
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            Not applicable
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                        Status
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={user.status === "active" ? "active" : "rejected"}
                          size="sm"
                        >
                          {user.status}
                        </Badge>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Joined {new Date(user.created_at).toLocaleDateString("en-NG")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                      Headshot Review
                    </p>
                    <div className="mt-2">
                      {user.role === "agent" ? (
                        user.avatar_url ? (
                          <div className="space-y-1">
                            <StatusBadge status={user.avatar_review_status} size="sm" />
                            {user.avatar_review_note && (
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {user.avatar_review_note}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="default" size="sm">
                            Missing photo
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Not required
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user.role === "agent" && user.avatar_url && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[9rem]"
                          onClick={() => handleApproveAvatar(user.id)}
                          disabled={isMutating || user.avatar_review_status === "approved"}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Approve Photo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 min-w-[9rem]"
                          onClick={() => {
                            setFlagModalUser(user);
                            setFlagNote(user.avatar_review_note ?? "");
                          }}
                          disabled={isMutating}
                        >
                          <Flag className="h-4 w-4" />
                          Flag Photo
                        </Button>
                      </>
                    )}

                    {agentRecord && agentRecord.verification_status !== "approved" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 min-w-[9rem]"
                        onClick={() => handleVerifyAgent(agentRecord.id)}
                        disabled={isMutating}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Verify
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 min-w-[9rem]"
                      onClick={() => handleToggleSuspension(user)}
                      disabled={isMutating}
                    >
                      {user.status === "active" ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {user.status === "active" ? "Suspend" : "Restore"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto lg:block">
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
                    Verification
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Headshot Review
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
                {filtered.map((user) => {
                  const agentRecord = agentsByUserId.get(user.id);

                  return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} fallback={user.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--color-text-primary)]">
                            {user.full_name}
                          </p>
                          <p className="truncate text-xs text-[var(--color-text-secondary)]">
                            {user.email ?? "No email"}
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
                      {agentRecord ? (
                        <StatusBadge status={agentRecord.verification_status} size="sm" />
                      ) : user.role === "agent" ? (
                        <Badge variant="default" size="sm">
                          No application
                        </Badge>
                      ) : (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Not applicable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "agent" ? (
                        user.avatar_url ? (
                          <div className="space-y-1">
                            <StatusBadge status={user.avatar_review_status} size="sm" />
                            {user.avatar_review_note && (
                              <p className="max-w-56 text-xs text-[var(--color-text-secondary)]">
                                {user.avatar_review_note}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="default" size="sm">
                            Missing photo
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Not required
                        </span>
                      )}
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
                      <div className="flex justify-end gap-2">
                        {user.role === "agent" && user.avatar_url && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApproveAvatar(user.id)}
                              disabled={isMutating || user.avatar_review_status === "approved"}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Approve Photo
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFlagModalUser(user);
                                setFlagNote(user.avatar_review_note ?? "");
                              }}
                              disabled={isMutating}
                            >
                              <Flag className="h-4 w-4" />
                              Flag Photo
                            </Button>
                          </>
                        )}
                        {agentRecord && agentRecord.verification_status !== "approved" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVerifyAgent(agentRecord.id)}
                            disabled={isMutating}
                          >
                            <BadgeCheck className="h-4 w-4" />
                            Verify
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSuspension(user)}
                          disabled={isMutating}
                        >
                          {user.status === "active" ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          {user.status === "active" ? "Suspend" : "Restore"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </div>

      <Modal
        isOpen={Boolean(flagModalUser)}
        onClose={() => {
          setFlagModalUser(null);
          setFlagNote("");
        }}
        title="Flag profile photo"
        className="space-y-4"
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          Tell the agent what to fix before this headshot can be approved.
        </p>
        <textarea
          value={flagNote}
          onChange={(event) => setFlagNote(event.target.value)}
          rows={5}
          placeholder="Example: Please upload a professional headshot with a plain white background and better face lighting."
          className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
        />
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setFlagModalUser(null);
              setFlagNote("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleFlagAvatar}
            isLoading={updateUserAvatarReview.isPending}
            disabled={flagNote.trim().length < 10}
          >
            Flag Photo
          </Button>
        </div>
      </Modal>
    </>
  );
}
