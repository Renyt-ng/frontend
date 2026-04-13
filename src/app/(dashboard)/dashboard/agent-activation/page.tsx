"use client";

import { useEffect, useMemo, useState } from "react";
import { fileToBase64 } from "@/lib/profileAvatar";
import {
  useAdminAgentActivationCandidates,
  useAdminAgentActivationWorkspace,
  useUpsertAdminAgentActivation,
} from "@/lib/hooks";
import { getAgentVerificationDocumentLabel, validateAgentVerificationFile } from "@/lib/agentVerification";
import {
  DashboardPanel,
  DashboardListSkeleton,
  DashboardSectionHeading,
  DashboardSectionNav,
  MetricCard,
} from "@/components/dashboard";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { CheckCircle2, Search, ShieldCheck, UserRoundSearch } from "lucide-react";
import type { AgentVerificationDocumentType } from "@/types";

type FileMap = Partial<Record<AgentVerificationDocumentType, File | null>>;
type ErrorMap = Partial<Record<AgentVerificationDocumentType, string>>;

export default function AgentActivationPage() {
  const [search, setSearch] = useState("");
  const candidatesQuery = useAdminAgentActivationCandidates(search);
  const [selectedId, setSelectedId] = useState("");
  const workspaceQuery = useAdminAgentActivationWorkspace(selectedId, {
    enabled: Boolean(selectedId),
  });
  const upsertActivation = useUpsertAdminAgentActivation();

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [whatsAppSame, setWhatsAppSame] = useState(true);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [files, setFiles] = useState<FileMap>({});
  const [fileErrors, setFileErrors] = useState<ErrorMap>({});
  const [submitError, setSubmitError] = useState("");
  const isCandidatesLoading = candidatesQuery.isLoading;
  const isWorkspaceLoading = workspaceQuery.isLoading && Boolean(selectedId);

  const candidates = candidatesQuery.data?.data ?? [];
  const workspace = workspaceQuery.data?.data;
  const requiredDocuments = workspace?.settings.required_document_types ?? [];

  useEffect(() => {
    if (!selectedId && candidates[0]?.profile.id) {
      setSelectedId(candidates[0].profile.id);
    }
  }, [candidates, selectedId]);

  useEffect(() => {
    if (!workspace?.candidate.agent) {
      setBusinessName("");
      setBusinessAddress("");
      setPrimaryPhone(workspace?.candidate.profile.phone ?? "");
      setWhatsAppSame(true);
      setWhatsAppPhone("");
      return;
    }

    setBusinessName(workspace.candidate.agent.business_name ?? "");
    setBusinessAddress(workspace.candidate.agent.business_address ?? "");
    setPrimaryPhone(workspace.candidate.agent.primary_phone ?? workspace.candidate.profile.phone ?? "");
    setWhatsAppSame(workspace.candidate.agent.whatsapp_same_as_primary_phone ?? true);
    setWhatsAppPhone(
      workspace.candidate.agent.whatsapp_same_as_primary_phone
        ? ""
        : (workspace.candidate.agent.whatsapp_phone ?? ""),
    );
    setFiles({});
    setFileErrors({});
    setSubmitError("");
  }, [workspace]);

  const summary = useMemo(() => {
    return {
      total: candidates.length,
      ready: candidates.filter((candidate) => candidate.agent?.verification_status === "approved").length,
      pending: candidates.filter((candidate) => candidate.agent?.verification_status === "pending").length,
    };
  }, [candidates]);

  async function handleFileChange(documentType: AgentVerificationDocumentType, file: File | null) {
    if (!file || !workspace?.settings) {
      setFiles((current) => ({ ...current, [documentType]: file }));
      return;
    }

    const nextError = validateAgentVerificationFile(file, workspace.settings);
    setFileErrors((current) => ({ ...current, [documentType]: nextError ?? "" }));
    if (nextError) {
      return;
    }

    setFiles((current) => ({ ...current, [documentType]: file }));
  }

  async function handleSubmit(approve: boolean) {
    if (!selectedId || !workspace) {
      return;
    }

    try {
      setSubmitError("");
      const verification_documents = await Promise.all(
        Object.entries(files)
          .filter(([, file]) => Boolean(file))
          .map(async ([document_type, file]) => ({
            document_type,
            file_name: (file as File).name,
            content_type: (file as File).type,
            base64_data: await fileToBase64(file as File),
          })),
      );

      await upsertActivation.mutateAsync({
        id: selectedId,
        data: {
          business_name: businessName,
          business_address: businessAddress,
          primary_phone: primaryPhone,
          whatsapp_same_as_primary_phone: whatsAppSame,
          whatsapp_phone: whatsAppSame ? null : whatsAppPhone,
          verification_documents,
          approve,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save agent activation";
      setSubmitError(message);
    }
  }

  const sectionItems = [
    { id: "candidate-list", label: "Candidates", count: summary.total },
    { id: "activation-workspace", label: "Workspace" },
    { id: "readiness", label: "Readiness", count: workspace?.readiness.missing_items.length ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Candidates" value={isCandidatesLoading ? "..." : summary.total} icon={UserRoundSearch} />
        <MetricCard label="Approved" value={isCandidatesLoading ? "..." : summary.ready} icon={CheckCircle2} emphasis="highlight" />
        <MetricCard label="Pending" value={isCandidatesLoading ? "..." : summary.pending} icon={ShieldCheck} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSectionNav items={sectionItems} className="order-2 xl:order-1" />

        <div className="order-1 min-w-0 space-y-6">
          <section id="candidate-list">
            <DashboardPanel>
              <DashboardSectionHeading title="Agent Activation" description="Search account. Complete package. Approve when ready." />
              <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email, or phone"
                    aria-label="Search existing agent accounts"
                  />
                  <div className="space-y-2">
                    {isCandidatesLoading ? (
                      <DashboardListSkeleton rows={4} itemClassName="h-20" />
                    ) : candidates.length === 0 ? (
                      <EmptyState icon={<Search size={20} />} title="No matches" description="Try a wider search." className="rounded-2xl border border-[var(--dashboard-border)] bg-white py-10" />
                    ) : (
                      candidates.map((candidate) => (
                        <button
                          key={candidate.profile.id}
                          type="button"
                          onClick={() => setSelectedId(candidate.profile.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedId === candidate.profile.id ? "border-[var(--dashboard-border-strong)] bg-white shadow-[var(--shadow-dashboard-sm)]" : "border-[var(--dashboard-border)] bg-[var(--dashboard-surface)]"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--dashboard-text-primary)]">{candidate.profile.full_name}</p>
                              <p className="mt-1 text-xs text-[var(--dashboard-text-secondary)]">{candidate.profile.email ?? candidate.profile.phone ?? "No contact"}</p>
                            </div>
                            <StatusBadge status={candidate.agent?.verification_status ?? (candidate.eligible ? "pending" : "rejected")} size="sm" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4" id="activation-workspace">
                  {isWorkspaceLoading ? (
                    <div className="space-y-4">
                      <DashboardListSkeleton rows={1} itemClassName="h-48" />
                      <DashboardListSkeleton rows={1} itemClassName="h-44" />
                      <DashboardListSkeleton rows={1} itemClassName="h-32" />
                    </div>
                  ) : !workspace ? (
                    <EmptyState title="Select an account" description="The verification workspace loads here." className="rounded-2xl border border-[var(--dashboard-border)] bg-white py-16" />
                  ) : (
                    <>
                      <DashboardPanel>
                        <DashboardSectionHeading title={workspace.candidate.profile.full_name} description={workspace.candidate.profile.email ?? workspace.candidate.profile.phone ?? "No contact info"} />
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <Input label="Business name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
                          <Input label="Primary phone" value={primaryPhone} onChange={(event) => setPrimaryPhone(event.target.value)} />
                          <div className="md:col-span-2">
                            <Input label="Business address" value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} />
                          </div>
                          <label className="flex items-center gap-3 rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3 text-sm text-[var(--dashboard-text-primary)]">
                            <input type="checkbox" checked={whatsAppSame} onChange={(event) => setWhatsAppSame(event.target.checked)} />
                            WhatsApp uses primary phone
                          </label>
                          {!whatsAppSame ? (
                            <Input label="WhatsApp phone" value={whatsAppPhone} onChange={(event) => setWhatsAppPhone(event.target.value)} />
                          ) : null}
                        </div>
                      </DashboardPanel>

                      <DashboardPanel>
                        <DashboardSectionHeading title="Verification documents" description="Only missing or changed files need upload." />
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {requiredDocuments.map((documentType) => {
                            const existingDocument = workspace.candidate.agent?.verification_documents.find(
                              (document) => document.document_type === documentType,
                            );

                            return (
                              <Card key={documentType}>
                                <CardContent className="space-y-3 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-[var(--dashboard-text-primary)]">
                                      {getAgentVerificationDocumentLabel(documentType)}
                                    </p>
                                    {existingDocument ? <StatusBadge status="approved" size="sm" /> : null}
                                  </div>
                                  <input
                                    type="file"
                                    accept={workspace.settings.allowed_mime_types.join(",")}
                                    onChange={(event) => handleFileChange(documentType, event.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-[var(--dashboard-text-secondary)]"
                                  />
                                  {existingDocument ? (
                                    <p className="text-xs text-[var(--dashboard-text-secondary)]">Current: {existingDocument.file_name}</p>
                                  ) : null}
                                  {fileErrors[documentType] ? (
                                    <p className="text-xs text-[var(--dashboard-critical)]">{fileErrors[documentType]}</p>
                                  ) : null}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </DashboardPanel>

                      <DashboardPanel id="readiness">
                        <DashboardSectionHeading title="Readiness" description={workspace.readiness.ready_for_approval ? "Ready to approve" : "Resolve blockers first"} />
                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusBadge status={workspace.readiness.profile_photo_ready ? "approved" : "rejected"} size="sm" />
                          <StatusBadge status={workspace.readiness.primary_phone_ready ? "approved" : "rejected"} size="sm" />
                          <StatusBadge status={workspace.readiness.whatsapp_ready ? "approved" : "rejected"} size="sm" />
                          <StatusBadge status={workspace.readiness.business_details_ready ? "approved" : "rejected"} size="sm" />
                          <StatusBadge status={workspace.readiness.required_documents_ready ? "approved" : "rejected"} size="sm" />
                        </div>
                        {workspace.readiness.missing_items.length > 0 ? (
                          <div className="mt-4 rounded-2xl border border-[var(--dashboard-border)] bg-white px-4 py-3 text-sm text-[var(--dashboard-text-secondary)]">
                            {workspace.readiness.missing_items.join(" · ")}
                          </div>
                        ) : null}
                        {submitError ? (
                          <div className="mt-4 rounded-2xl border border-[color:rgba(192,57,43,0.18)] bg-[color:rgba(192,57,43,0.03)] px-4 py-3 text-sm text-[var(--dashboard-critical)]">
                            {submitError}
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="secondary" onClick={() => void handleSubmit(false)} disabled={upsertActivation.isPending}>Save package</Button>
                          <Button onClick={() => void handleSubmit(true)} disabled={upsertActivation.isPending || !workspace.readiness.ready_for_approval}>Approve agent</Button>
                        </div>
                      </DashboardPanel>
                    </>
                  )}
                </div>
              </div>
            </DashboardPanel>
          </section>
        </div>
      </div>
    </div>
  );
}