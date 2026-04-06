"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";

interface PricingBreakdownProps {
  property: Property;
}

export function PricingBreakdown({ property }: PricingBreakdownProps) {
  const rentAmount = property.rent_amount ?? 0;
  const askingPrice = property.asking_price ?? 0;
  const isSaleListing = property.listing_purpose === "sale";
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isSaleListing) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8">
        <div className="flex flex-col items-start justify-center gap-2 text-left">
          {property.is_price_negotiable ? (
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              Asking
            </span>
          ) : null}
          <p className="text-3xl font-bold leading-none text-[var(--color-deep-slate-blue)] sm:text-4xl">
            {formatCurrency(askingPrice)}
          </p>
        </div>
      </div>
    );
  }

  const feeItems = property.property_fees?.length
    ? property.property_fees.map((fee) => ({
        label: fee.label,
        amount: fee.calculated_amount,
        meta:
          fee.value_type === "percentage" && fee.percentage != null
            ? `${fee.percentage}% of annual rent`
            : null,
      }))
    : [
        { label: "Service Charge", amount: property.service_charge, meta: null },
        { label: "Caution Deposit", amount: property.caution_deposit, meta: null },
        { label: "Agency Fee", amount: property.agency_fee, meta: null },
      ].filter((item) => item.amount != null);

  const baseAmount = rentAmount;
  const total = property.pricing_summary?.total_move_in_cost ?? (
    baseAmount + feeItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  );
  const monthly = property.pricing_summary?.monthly_equivalent ?? rentAmount / 12;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
              Total Move-in Cost
            </p>
            <button
              type="button"
              aria-expanded={showBreakdown}
              aria-label={showBreakdown ? "Hide move-in cost breakdown" : "Show move-in cost breakdown"}
              onClick={() => setShowBreakdown((current) => !current)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-deep-slate-blue)]"
            >
              <CircleAlert className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-3xl font-bold leading-none text-[var(--color-deep-slate-blue)] sm:text-4xl">
            {formatCurrency(total)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Tap the hint icon to see how rent and fees make up the move-in total.
          </p>
        </div>
      </div>

      {showBreakdown ? (
        <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5">
          <div className="flex items-start justify-between gap-4">
            <span className="min-w-0 text-sm text-[var(--color-text-secondary)]">
              Annual Rent
            </span>
            <span className="text-right text-base font-semibold text-[var(--color-text-primary)]">
              {formatCurrency(baseAmount)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="min-w-0 text-sm text-[var(--color-text-secondary)]">
              Monthly Equivalent
            </span>
            <span className="text-right text-sm text-[var(--color-text-primary)]">
              {formatCurrency(monthly)}
            </span>
          </div>
          {feeItems.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="break-words text-sm text-[var(--color-text-secondary)]">
                  {item.label}
                </span>
                {item.meta ? (
                  <p className="break-words text-xs text-[var(--color-text-secondary)]">{item.meta}</p>
                ) : null}
              </div>
              <span className="text-right text-sm text-[var(--color-text-primary)]">
                {item.amount != null ? formatCurrency(item.amount) : "—"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
