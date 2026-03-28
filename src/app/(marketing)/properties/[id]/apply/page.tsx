"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { ArrowLeft, FileText, MessageCircle } from "lucide-react";
import { Card, CardContent, Button, Input, NumericInput } from "@/components/ui";
import { useProperty, useSubmitApplication } from "@/lib/hooks";
import { buildWhatsAppHref, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const applicationSchema = z.object({
  employment_status: z.string().min(2, "Employment status is required"),
  monthly_income: z
    .union([z.number(), z.null()])
    .refine((value) => value != null, {
      message: "Monthly income is required",
    })
    .refine((value) => value == null || value > 0, {
      message: "Monthly income must be greater than 0",
    })
    .transform((value) => value as number),
  guarantor_name: z.string().min(2, "Guarantor name is required"),
  guarantor_phone: z.string().min(5, "Guarantor phone is required"),
  rental_history: z.string().optional(),
});

type ApplicationValues = z.output<typeof applicationSchema>;
type ApplicationFormValues = z.input<typeof applicationSchema>;

export default function PropertyApplyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const propertyId = typeof params.id === "string" ? params.id : "";
  const propertyQuery = useProperty(propertyId);
  const submitApplication = useSubmitApplication();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ApplicationFormValues, undefined, ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      employment_status: "",
      monthly_income: null,
      guarantor_name: "",
      guarantor_phone: "",
      rental_history: "",
    },
  });

  const property = propertyQuery.data?.data;
  const canInstantApply =
    property?.listing_purpose === "rent" &&
    property?.application_mode === "instant_apply";
  const agentPhone = property?.agent_contact?.phone?.trim() ?? "";
  const whatsappHref = agentPhone
    ? buildWhatsAppHref(
        agentPhone,
        `Hi, I'm interested in ${property?.title ?? "this property"} on Renyt.`,
      )
    : "";

  async function onSubmit(values: ApplicationValues) {
    if (!propertyId) {
      return;
    }

    setServerError("");

    try {
      await submitApplication.mutateAsync({
        property_id: propertyId,
        ...values,
        rental_history: values.rental_history || null,
      });
      router.push("/dashboard/applications");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.error?.message ??
            error.message ??
            "Could not submit application",
        );
        return;
      }

      setServerError("Could not submit application");
    }
  }

  if (propertyQuery.isLoading || authLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          Property details could not be loaded.
        </div>
      </div>
    );
  }

  if (property.listing_purpose === "sale") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Property
        </Link>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              This home accepts contact requests, not rental applications
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Use Message Agent from the property page to share your contact details and continue the conversation.
            </p>
            <Link href={`/properties/${propertyId}`}>
              <Button variant="secondary">Back to Property</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Sign in to continue
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              You need a tenant account to submit rental applications.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary">Create Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "tenant") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Tenant access required
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Only tenant accounts can submit property applications.
            </p>
            <Link href={`/properties/${propertyId}`}>
              <Button variant="secondary">Back to Property</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canInstantApply) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Property
        </Link>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              This listing uses Message Agent
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {property.title} is not configured for instant applications. Reach out to the agent directly to continue the conversation.
            </p>
            {agentPhone ? (
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button>
                  <MessageCircle className="h-4 w-4" />
                  Message Agent
                </Button>
              </a>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border)] bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Agent contact details are not available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Property
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-[var(--color-text-primary)]">
          Instant Apply
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Apply for {property.title} in {property.area}. Annual rent is {formatCurrency(property.rent_amount ?? 0)}.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          You can message the agent first if you want clarification before submitting the form.
        </p>
      </div>

      {serverError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[var(--color-deep-slate-blue)]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">
                  Tenant Application
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Provide the core details the agent needs to review your request.
                </p>
              </div>
            </div>

            {agentPhone && (
              <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-gray-50 p-4">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <Button type="button" variant="secondary">
                    <MessageCircle className="h-4 w-4" />
                    Message Agent First
                  </Button>
                </a>
              </div>
            )}

            <Input
              id="employment_status"
              label="Employment Status"
              placeholder="Full-time employed"
              error={errors.employment_status?.message}
              {...register("employment_status")}
            />

            <Controller
              control={control}
              name="monthly_income"
              render={({ field }) => (
                <NumericInput
                  id="monthly_income"
                  label="Monthly Income (NGN)"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  format="currency"
                  error={errors.monthly_income?.message}
                />
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="guarantor_name"
                label="Guarantor Name"
                error={errors.guarantor_name?.message}
                {...register("guarantor_name")}
              />
              <Input
                id="guarantor_phone"
                label="Guarantor Phone"
                error={errors.guarantor_phone?.message}
                {...register("guarantor_phone")}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rental_history"
                className="block text-sm font-medium text-[var(--color-text-primary)]"
              >
                Rental History
              </label>
              <textarea
                id="rental_history"
                rows={5}
                placeholder="Share any previous rental experience or useful context for the agent."
                className="flex w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20"
                {...register("rental_history")}
              />
              {errors.rental_history && (
                <p className="text-sm text-[var(--color-rejected)]">
                  {errors.rental_history.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={submitApplication.isPending}>
                Submit Application
              </Button>
              <Link href={`/properties/${propertyId}`}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}