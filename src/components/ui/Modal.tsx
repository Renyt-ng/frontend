"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  dialogClassName?: string;
  ariaLabel?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  dialogClassName,
  ariaLabel,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-label={ariaLabel || title}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:max-h-[85vh] sm:w-full",
        dialogClassName,
      )}
    >
      <div className={cn("p-4 sm:p-6", className)}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
