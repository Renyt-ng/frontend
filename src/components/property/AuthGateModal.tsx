"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button, Modal } from "@/components/ui";

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  loginHref: string;
  registerHref: string;
}

export function AuthGateModal({
  isOpen,
  onClose,
  title,
  description,
  loginHref,
  registerHref,
}: AuthGateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--color-emerald)]">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={loginHref} className="flex-1">
          <Button className="w-full">Sign In</Button>
        </Link>
        <Link href={registerHref} className="flex-1">
          <Button variant="secondary" className="w-full">
            Create Account
          </Button>
        </Link>
      </div>
    </Modal>
  );
}