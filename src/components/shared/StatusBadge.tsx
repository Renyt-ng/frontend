import { Badge, type BadgeProps } from "@/components/ui";

const STATUS_MAP: Record<
  string,
  { variant: BadgeProps["variant"]; label: string }
> = {
  active: { variant: "active", label: "Active" },
  archived: { variant: "archived", label: "Archived" },
  rented: { variant: "info", label: "Rented" },
  pending: { variant: "pending", label: "Pending" },
  approved: { variant: "verified", label: "Approved" },
  flagged: { variant: "rejected", label: "Flagged" },
  rejected: { variant: "rejected", label: "Rejected" },
  draft: { variant: "default", label: "Draft" },
  sent: { variant: "info", label: "Sent" },
  signed: { variant: "verified", label: "Signed" },
  cancelled: { variant: "rejected", label: "Cancelled" },
  none: { variant: "default", label: "Unverified" },
};

interface StatusBadgeProps {
  status: string;
  size?: BadgeProps["size"];
}

export function StatusBadge({ status, size }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    variant: "default" as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}
