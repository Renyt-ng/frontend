"use client";

import { useEffect, useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useCreatePropertyInquiry } from "@/lib/hooks/usePropertyInteractions";

interface SaleInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  referralCode?: string | null;
}

export function SaleInquiryModal({
  isOpen,
  onClose,
  propertyId,
  referralCode,
}: SaleInquiryModalProps) {
  const user = useAuthStore((state) => state.user);
  const createInquiry = useCreatePropertyInquiry();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFullName(user?.full_name ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
    setNote("");
    setFeedback(null);
    setError(null);
  }, [isOpen, user?.email, user?.full_name, user?.phone]);

  async function handleSubmit() {
    setError(null);
    setFeedback(null);

    try {
      await createInquiry.mutateAsync({
        propertyId,
        data: {
          full_name: fullName,
          phone,
          email,
          note: note || null,
          referral_code: referralCode ?? null,
        },
      });

      setFeedback("Your inquiry has been sent. The agent will follow up using your contact details.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not send your inquiry right now",
      );
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send inquiry" className="space-y-4" ariaLabel="Property inquiry">
      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
        Your inquiry goes directly to the agent for this listing.
      </p>

      {feedback ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            id="inquiry_full_name"
            label="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input
            id="inquiry_phone"
            label="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            id="inquiry_email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div>
            <label
              htmlFor="inquiry_note"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Add a short note
            </label>
            <textarea
              id="inquiry_note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional: move-in timing, preferred contact time, or any other context"
              className="min-h-24 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[var(--color-rejected)]">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSubmit} isLoading={createInquiry.isPending}>
              Send Inquiry
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}