import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";

interface PricingBreakdownProps {
  property: Property;
}

export function PricingBreakdown({ property }: PricingBreakdownProps) {
  const items = [
    { label: "Annual Rent", amount: property.rent_amount, primary: true },
    { label: "Service Charge", amount: property.service_charge },
    { label: "Caution Deposit", amount: property.caution_deposit },
    { label: "Agency Fee", amount: property.agency_fee },
  ];

  const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Pricing Breakdown
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {item.label}
            </span>
            <span
              className={
                item.primary
                  ? "text-base font-semibold text-[var(--color-text-primary)]"
                  : "text-sm text-[var(--color-text-primary)]"
              }
            >
              {item.amount != null ? formatCurrency(item.amount) : "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Total Move-in Cost
          </span>
          <span className="text-xl font-bold text-[var(--color-deep-slate-blue)]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
