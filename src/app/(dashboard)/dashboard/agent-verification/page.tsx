"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  Building2,
  CheckCircle2,
  FileBadge2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import {
  useAgentVerificationSettings,
  useCreateAgent,
  useMyAgent,
  usePhoneVerificationStatus,
  useRequestPhoneVerification,
  useVerifyPhoneVerification,
} from "@/lib/hooks";
import {
  getAgentVerificationDocumentLabel,
  validateAgentVerificationFile,
} from "@/lib/agentVerification";
import { fileToBase64 } from "@/lib/profileAvatar";
import {
  formatNigerianPhone,
  isValidNigerianPhone,
  normalizeNigerianPhone,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { AgentVerificationDocumentType } from "@/types";

const agentApplicationSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  business_address: z.string().min(5, "Business address is required"),
});

type AgentApplicationValues = z.infer<typeof agentApplicationSchema>;

function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  return error.response?.data?.error?.message ?? error.message ?? fallback;
}

function formatCountdown(target: string | null, now: number) {
  if (!target) {
    return null;
  }

  const ms = new Date(target).getTime() - now;
  if (ms <= 0) {
    return null;
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function buildChecklistItem(completed: boolean, label: string) {
  return {
    completed,
    label,
  };
}

export default function AgentVerificationPage() {
  const { user } = useAuthStore();
  const myAgentQuery = useMyAgent({
    enabled: user?.role === "agent",
    retry: false,
  });
  const verificationSettingsQuery = useAgentVerificationSettings({
    enabled: user?.role === "agent",
  });
  const phoneVerificationQuery = usePhoneVerificationStatus({
    enabled: user?.role === "agent",
  });
  const requestPhoneVerification = useRequestPhoneVerification();
  const verifyPhoneVerification = useVerifyPhoneVerification();
  const createAgent = useCreateAgent();

  const [serverError, setServerError] = useState("");
  const [documentErrors, setDocumentErrors] = useState<
    Partial<Record<AgentVerificationDocumentType, string>>
  >({});
  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<AgentVerificationDocumentType, File | null>>
  >({});
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [whatsappSameAsPrimaryPhone, setWhatsappSameAsPrimaryPhone] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const phoneSectionRef = useRef<HTMLElement | null>(null);
  const whatsappSectionRef = useRef<HTMLElement | null>(null);
  const businessSectionRef = useRef<HTMLElement | null>(null);
  const documentsSectionRef = useRef<HTMLElement | null>(null);

  const missingHeadshot = !user?.avatar_url;
  const flaggedHeadshot = user?.avatar_review_status === "flagged";
  const blockedByHeadshot = missingHeadshot || flaggedHeadshot;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AgentApplicationValues>({
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      business_name: "",
      business_address: "",
    },
  });

  const existingAgent = myAgentQuery.data?.data ?? null;
  const canResubmitRejectedAgent = existingAgent?.verification_status === "rejected";
  const agentNotFound =
    axios.isAxiosError(myAgentQuery.error) &&
    myAgentQuery.error.response?.status === 404;
  const phoneStatus = phoneVerificationQuery.data?.data;
  const watchedBusinessName = watch("business_name");
  const watchedBusinessAddress = watch("business_address");

  useEffect(() => {
    if (!phoneStatus) {
      return;
    }

    setPrimaryPhone(phoneStatus.phone ?? "");
  }, [phoneStatus?.phone]);

  useEffect(() => {
    if (!canResubmitRejectedAgent || !existingAgent) {
      return;
    }

    reset({
      business_name: existingAgent.business_name ?? "",
      business_address: existingAgent.business_address ?? "",
    });
  }, [canResubmitRejectedAgent, existingAgent, reset]);

  useEffect(() => {
    const hasActiveTimer =
      Boolean(phoneStatus?.locked_until && new Date(phoneStatus.locked_until).getTime() > now) ||
      Boolean(
        phoneStatus?.resend_available_at &&
          new Date(phoneStatus.resend_available_at).getTime() > now,
      );

    if (!hasActiveTimer) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [now, phoneStatus?.locked_until, phoneStatus?.resend_available_at]);

  const normalizedPrimaryPhone = normalizeNigerianPhone(primaryPhone);
  const persistedPhone = phoneStatus?.phone ?? "";
  const phoneMatchesPersisted =
    Boolean(normalizedPrimaryPhone) &&
    normalizedPrimaryPhone === normalizeNigerianPhone(persistedPhone);
  const isPhoneVerified = Boolean(phoneStatus?.verified && phoneMatchesPersisted);
  const phoneVerificationPending = Boolean(phoneStatus?.code_sent && phoneMatchesPersisted);
  const resendCountdown = formatCountdown(phoneStatus?.resend_available_at ?? null, now);
  const lockCountdown = formatCountdown(phoneStatus?.locked_until ?? null, now);
  const canRequestPhoneVerificationCode =
    isValidNigerianPhone(primaryPhone) && !Boolean(resendCountdown) && !isPhoneVerified;
  const businessDetailsComplete =
    watchedBusinessName.trim().length >= 2 && watchedBusinessAddress.trim().length >= 5;
  const documentsReady = Boolean(
    verificationSettingsQuery.data?.data.required_document_types.every(
      (documentType) => Boolean(selectedFiles[documentType]),
    ),
  );
  const whatsappConfigured = isPhoneVerified
    ? whatsappSameAsPrimaryPhone || isValidNigerianPhone(whatsappPhone)
    : false;
  const readinessItems = [
    buildChecklistItem(!blockedByHeadshot, "Headshot ready"),
    buildChecklistItem(isPhoneVerified, "Verify your primary phone"),
    buildChecklistItem(whatsappConfigured, "Choose your WhatsApp contact number"),
    buildChecklistItem(documentsReady, "Upload required verification documents"),
    buildChecklistItem(businessDetailsComplete, "Complete business details"),
  ];
  const canSubmit = readinessItems.every((item) => item.completed);

  useEffect(() => {
    if (!canResubmitRejectedAgent || !existingAgent) {
      return;
    }

    setWhatsappSameAsPrimaryPhone(existingAgent.whatsapp_same_as_primary_phone);
    setWhatsappPhone(
      existingAgent.whatsapp_same_as_primary_phone
        ? ""
        : (existingAgent.whatsapp_phone ?? ""),
    );
  }, [canResubmitRejectedAgent, existingAgent]);

  function scrollToSection(section: "phone" | "whatsapp" | "business" | "documents") {
    const refMap = {
      phone: phoneSectionRef,
      whatsapp: whatsappSectionRef,
      business: businessSectionRef,
      documents: documentsSectionRef,
    };

    refMap[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSendCode() {
    setServerError("");
    setPhoneError("");
    setOtpError("");

    if (!isValidNigerianPhone(primaryPhone)) {
      setPhoneError("Enter a valid Nigerian phone number before requesting a verification code.");
      return;
    }

    try {
      const res = await requestPhoneVerification.mutateAsync({
        phone: primaryPhone,
      });

      setPrimaryPhone(res.data.phone ?? formatNigerianPhone(primaryPhone));
      setOtpCode("");
      setDevelopmentCode(res.data.development_code ?? null);
      setLiveAnnouncement("Verification code sent");
    } catch (error) {
      setPhoneError(extractApiError(error, "Could not send verification code."));
    }
  }

  async function handleVerifyCode() {
    setServerError("");
    setOtpError("");

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError("Enter the 6-digit verification code.");
      return;
    }

    try {
      await verifyPhoneVerification.mutateAsync({ code: otpCode.trim() });
      setOtpCode("");
      setDevelopmentCode(null);
      setLiveAnnouncement("Phone number verified");
    } catch (error) {
      setOtpError(extractApiError(error, "Verification failed, try again."));
      setLiveAnnouncement("Verification failed, try again");
    }
  }

  async function onSubmit(values: AgentApplicationValues) {
    setServerError("");
    setPhoneError("");
    setOtpError("");
    setWhatsappError("");

    const settings = verificationSettingsQuery.data?.data;
    if (!settings) {
      setServerError("Verification requirements are still loading. Try again in a moment.");
      return;
    }

    if (!isPhoneVerified) {
      setPhoneError("Verify your primary phone before submitting.");
      scrollToSection("phone");
      return;
    }

    if (!whatsappSameAsPrimaryPhone && !isValidNigerianPhone(whatsappPhone)) {
      setWhatsappError("Enter a valid Nigerian WhatsApp number.");
      scrollToSection("whatsapp");
      return;
    }

    const nextDocumentErrors: Partial<Record<AgentVerificationDocumentType, string>> = {};
    for (const documentType of settings.required_document_types) {
      const file = selectedFiles[documentType] ?? null;

      if (!file) {
        nextDocumentErrors[documentType] = `Upload your ${getAgentVerificationDocumentLabel(documentType).toLowerCase()}.`;
        continue;
      }

      const validationError = validateAgentVerificationFile(file, settings);
      if (validationError) {
        nextDocumentErrors[documentType] = validationError;
      }
    }

    setDocumentErrors(nextDocumentErrors);

    if (Object.keys(nextDocumentErrors).length > 0) {
      scrollToSection("documents");
      return;
    }

    try {
      const verificationDocuments = await Promise.all(
        settings.required_document_types.map(async (documentType) => {
          const file = selectedFiles[documentType]!;

          return {
            document_type: documentType,
            file_name: file.name,
            content_type: file.type,
            base64_data: await fileToBase64(file),
          };
        }),
      );

      await createAgent.mutateAsync({
        business_name: values.business_name,
        business_address: values.business_address,
        whatsapp_same_as_primary_phone: whatsappSameAsPrimaryPhone,
        whatsapp_phone: whatsappSameAsPrimaryPhone ? null : formatNigerianPhone(whatsappPhone),
        verification_documents: verificationDocuments,
      });

      await myAgentQuery.refetch();
    } catch (error) {
      setServerError(extractApiError(error, "Could not submit verification application"));
    }
  }

  function handleFileChange(documentType: AgentVerificationDocumentType, file: File | null) {
    setServerError("");

    if (!file || !verificationSettingsQuery.data?.data) {
      setSelectedFiles((current) => ({
        ...current,
        [documentType]: file,
      }));
      setDocumentErrors((current) => ({
        ...current,
        [documentType]: "",
      }));
      return;
    }

    const validationError = validateAgentVerificationFile(
      file,
      verificationSettingsQuery.data.data,
    );

    setSelectedFiles((current) => ({
      ...current,
      [documentType]: validationError ? null : file,
    }));
    setDocumentErrors((current) => ({
      ...current,
      [documentType]: validationError ?? "",
    }));
  }

  const submittedWhatsappSummary = useMemo(() => {
    if (!existingAgent) {
      return null;
    }

    if (existingAgent.whatsapp_same_as_primary_phone) {
      return "WhatsApp contact uses your verified primary phone";
    }

    if (existingAgent.whatsapp_phone) {
      return `WhatsApp contact uses ${existingAgent.whatsapp_phone}`;
    }

    return "WhatsApp contact not configured";
  }, [existingAgent]);

  if (user?.role !== "agent") {
    return (
      <EmptyState
        icon={<ShieldCheck size={28} />}
        title="Agent Access Required"
        description="Only agent accounts can submit verification applications."
      />
    );
  }

  if (myAgentQuery.isLoading || verificationSettingsQuery.isLoading || phoneVerificationQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (existingAgent && !canResubmitRejectedAgent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Agent Verification
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Track the current review status of your agent application.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {existingAgent.business_name}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {existingAgent.business_address}
                </p>
              </div>
              <StatusBadge status={existingAgent.verification_status} size="sm" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 p-4 text-sm text-[var(--color-text-secondary)]">
              {existingAgent.verification_status === "approved"
                ? "Your account is approved. You can now publish listings and receive tenant applications."
                : existingAgent.verification_status === "rejected"
                  ? "Your previous application was rejected. Review your submission details and contact an admin before resubmitting."
                  : "Primary phone verified. Submission under review."}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Verified primary phone
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  {existingAgent.primary_phone ?? "Not provided"}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {existingAgent.phone_verified ? "Phone verified" : "Verification reset"}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  WhatsApp contact
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  {existingAgent.whatsapp_phone ?? existingAgent.primary_phone ?? "Not provided"}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {submittedWhatsappSummary}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Submitted documents
              </p>
              <div className="mt-3 grid gap-2">
                {(existingAgent.verification_documents ?? []).map((document) => (
                  <div
                    key={`${document.document_type}-${document.storage_path}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {getAgentVerificationDocumentLabel(document.document_type)}
                      </p>
                      <p className="text-[var(--color-text-secondary)]">{document.file_name}</p>
                    </div>
                    {document.signed_url ? (
                      <a
                        href={document.signed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-deep-slate-blue)] hover:underline"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/properties/new">
                <Button>
                  <Building2 className="h-4 w-4" />
                  Create Listing
                </Button>
              </Link>
              <Link href="/dashboard/properties">
                <Button variant="secondary">View My Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myAgentQuery.isError && !agentNotFound) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
        Could not load your verification status. Confirm the backend is running and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {canResubmitRejectedAgent ? "Resubmit Agent Verification" : "Submit Agent Verification"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {canResubmitRejectedAgent
            ? "Your previous submission was rejected. Update the required details, upload a fresh verification package, and submit another review attempt."
            : "Verify your primary phone, choose your WhatsApp contact, and complete the required business details and documents."}
        </p>
      </div>

      {canResubmitRejectedAgent && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Your previous verification request was rejected. You can make another attempt from this page.
        </div>
      )}

      {missingHeadshot && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Upload a professional headshot on a plain white background in your profile settings before submitting verification.
        </div>
      )}

      {flaggedHeadshot && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          <p className="font-medium">Your current headshot needs to be replaced.</p>
          {user?.avatar_review_note && <p className="mt-1">{user.avatar_review_note}</p>}
        </div>
      )}

      {serverError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-6 p-6">
            <section
              ref={phoneSectionRef}
              className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Phone Verification
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Verify your primary phone before submitting.
                  </p>
                </div>
                <StatusBadge status={isPhoneVerified ? "approved" : "none"} size="sm" />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <Input
                  id="primary_phone"
                  label="Primary phone number"
                  aria-label="Primary phone number"
                  inputMode="tel"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={primaryPhone}
                  disabled={requestPhoneVerification.isPending}
                  error={phoneError}
                  onChange={(event) => {
                    setPrimaryPhone(event.target.value);
                    setPhoneError("");
                    setOtpError("");
                    setLiveAnnouncement("");
                    if (event.target.value.trim() !== persistedPhone.trim()) {
                      setDevelopmentCode(null);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="lg"
                  className="w-full lg:w-auto"
                  isLoading={requestPhoneVerification.isPending}
                  disabled={!canRequestPhoneVerificationCode}
                  onClick={handleSendCode}
                >
                  <Smartphone className="h-4 w-4" />
                  {phoneVerificationPending ? "Resend code" : "Send code"}
                </Button>
              </div>

              {lockCountdown ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Too many attempts. Try again in {lockCountdown}.
                </div>
              ) : null}

              {phoneVerificationPending && !isPhoneVerified ? (
                <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <Input
                    id="verification_code"
                    label="Verification code"
                    aria-label="Verification code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter the 6-digit code"
                    value={otpCode}
                    error={otpError}
                    onChange={(event) => {
                      setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError("");
                    }}
                  />

                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Button
                      type="button"
                      isLoading={verifyPhoneVerification.isPending}
                      disabled={otpCode.trim().length !== 6}
                      onClick={handleVerifyCode}
                    >
                      Verify code
                    </Button>

                    {resendCountdown ? (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Resend in {resendCountdown}
                      </p>
                    ) : (
                      <Button type="button" variant="link" onClick={handleSendCode}>
                        Resend code
                      </Button>
                    )}
                  </div>

                  {developmentCode ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[var(--color-deep-slate-blue)]">
                      Development code: {developmentCode}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isPhoneVerified ? (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Phone verified.
                </div>
              ) : null}
            </section>

            <section
              ref={whatsappSectionRef}
              className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  WhatsApp Contact
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Choose which number tenants should reach on WhatsApp.
                </p>
              </div>

              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
                  checked={whatsappSameAsPrimaryPhone}
                  disabled={!isPhoneVerified}
                  onChange={(event) => {
                    setWhatsappSameAsPrimaryPhone(event.target.checked);
                    setWhatsappError("");
                    if (event.target.checked) {
                      setWhatsappPhone("");
                    }
                  }}
                />
                <span>WhatsApp number is the same as my primary phone</span>
              </label>

              {!isPhoneVerified ? (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Verify your primary phone to unlock WhatsApp contact settings.
                </p>
              ) : whatsappSameAsPrimaryPhone ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  WhatsApp will use your verified primary phone.
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 p-4">
                  <Input
                    id="whatsapp_phone"
                    label="WhatsApp number"
                    aria-label="WhatsApp number"
                    inputMode="tel"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={whatsappPhone}
                    error={whatsappError}
                    onChange={(event) => {
                      setWhatsappPhone(event.target.value);
                      setWhatsappError("");
                    }}
                  />
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Used for WhatsApp only.
                  </p>
                </div>
              )}
            </section>

            <section ref={businessSectionRef} className="space-y-5">
              <Input
                id="business_name"
                label="Business Name"
                placeholder="Renyt Homes Ltd"
                error={errors.business_name?.message}
                {...register("business_name")}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="business_address"
                  className="block text-sm font-medium text-[var(--color-text-primary)]"
                >
                  Business Address
                </label>
                <textarea
                  id="business_address"
                  rows={4}
                  placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
                  className="flex w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20"
                  {...register("business_address")}
                />
                {errors.business_address && (
                  <p className="text-sm text-[var(--color-rejected)]">
                    {errors.business_address.message}
                  </p>
                )}
              </div>
            </section>

            <section
              ref={documentsSectionRef}
              className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-deep-slate-blue)]/8 text-[var(--color-deep-slate-blue)]">
                  <FileBadge2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Verification Documents
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Upload clear, readable files for each required document before you submit your application.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {verificationSettingsQuery.data?.data.required_document_types.map((documentType) => {
                  const selectedFile = selectedFiles[documentType];
                  const error = documentErrors[documentType];

                  return (
                    <div
                      key={documentType}
                      className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                            {getAgentVerificationDocumentLabel(documentType)}
                          </label>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Accepted types: {verificationSettingsQuery.data?.data.allowed_mime_types.join(", ")}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Maximum file size: {verificationSettingsQuery.data?.data.max_file_size_mb}MB
                          </p>
                        </div>
                        <span className="inline-flex w-fit rounded-full bg-[var(--color-deep-slate-blue)]/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-deep-slate-blue)]">
                          Required
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-gray-50 px-4 py-4">
                        <input
                          type="file"
                          className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--color-deep-slate-blue)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#162d4a]"
                          accept={verificationSettingsQuery.data?.data.allowed_mime_types.join(",")}
                          onChange={(event) =>
                            handleFileChange(documentType, event.target.files?.[0] ?? null)
                          }
                        />
                      </div>

                      {selectedFile ? (
                        <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">
                          Selected: {selectedFile.name}
                        </p>
                      ) : null}
                      {error ? (
                        <p className="mt-2 text-sm text-[var(--color-rejected)]">{error}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Submission Readiness
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Review the remaining blockers before submitting your verification package.
                </p>
              </div>

              <div aria-label="Verification submission checklist" className="space-y-2">
                {readinessItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-left text-sm"
                    onClick={() => {
                      if (item.label.includes("phone")) {
                        scrollToSection("phone");
                        return;
                      }
                      if (item.label.includes("WhatsApp")) {
                        scrollToSection("whatsapp");
                        return;
                      }
                      if (item.label.includes("documents")) {
                        scrollToSection("documents");
                        return;
                      }
                      if (item.label.includes("business")) {
                        scrollToSection("business");
                      }
                    }}
                  >
                    <span className="text-[var(--color-text-primary)]">{item.label}</span>
                    <span
                      className={item.completed ? "text-emerald-700" : "text-[var(--color-text-secondary)]"}
                    >
                      {item.completed ? "Complete" : "Incomplete"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                isLoading={createAgent.isPending}
                variant="secondary"
                disabled={!canSubmit}
              >
                <FileBadge2 className="h-4 w-4" />
                Submit Verification
              </Button>
              {blockedByHeadshot && (
                <Link href="/dashboard/settings">
                  <Button variant="secondary" type="button">
                    Upload Headshot First
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" type="button">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}