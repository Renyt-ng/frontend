import { BedDouble, Bath, Ruler, Calendar } from "lucide-react";
import { formatDate, PROPERTY_TYPE_LABELS } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertySpecsProps {
  property: Property;
}

export function PropertySpecs({ property }: PropertySpecsProps) {
  const specs = [
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: property.bedrooms,
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: property.bathrooms,
    },
    {
      icon: Ruler,
      label: "Type",
      value:
        PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type,
    },
    {
      icon: Calendar,
      label: "Listed",
      value: formatDate(property.created_at),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <div
            key={spec.label}
            className="flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-white p-4 text-center"
          >
            <Icon className="mb-2 h-5 w-5 text-[var(--color-deep-slate-blue)]" />
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {spec.value}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {spec.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
