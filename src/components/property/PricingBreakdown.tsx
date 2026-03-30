import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";

interface PricingBreakdownProps {
  property: Property;
}

export function PricingBreakdown({ property }: PricingBreakdownProps) {
  const rentAmount = property.rent_amount ?? 0;
  const askingPrice = property.asking_price ?? 0;
  const isSaleListing = property.listing_purpose === "sale";
  const feeItems = property.property_fees?.length
    ? property.property_fees.map((fee) => ({
        label: fee.label,
        amount: fee.calculated_amount,
        meta:
          fee.value_type === "percentage" && fee.percentage != null
            ? `${fee.percentage}% of ${isSaleListing ? "asking price" : "annual rent"}`
            : null,
      }))
    : [
        { label: "Service Charge", amount: property.service_charge, meta: null },
        { label: "Caution Deposit", amount: property.caution_deposit, meta: null },
        { label: "Agency Fee", amount: property.agency_fee, meta: null },
      ].filter((item) => item.amount != null);

  const baseAmount = isSaleListing ? askingPrice : rentAmount;
  const total = property.pricing_summary?.total_move_in_cost ?? (
    baseAmount + feeItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  );
  const monthly = property.pricing_summary?.monthly_equivalent ?? rentAmount / 12;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Pricing Breakdown
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {isSaleListing ? "Asking Price" : "Annual Rent"}
          </span>
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(baseAmount)}
          </span>
        </div>
        {!isSaleListing ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Monthly Equivalent
            </span>
            <span className="text-sm text-[var(--color-text-primary)]">
              {formatCurrency(monthly)}
            </span>
          </div>
        ) : null}
        {feeItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {item.label}
              </span>
              {item.meta && (
                <p className="text-xs text-[var(--color-text-secondary)]">{item.meta}</p>
              )}
            </div>
            <span className="text-sm text-[var(--color-text-primary)]">
              {item.amount != null ? formatCurrency(item.amount) : "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {isSaleListing ? "Total Buyer Cost" : "Total Move-in Cost"}
          </span>
          <span className="text-xl font-bold text-[var(--color-deep-slate-blue)]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
