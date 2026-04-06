import { Badge, Card, CardContent, Avatar } from "@/components/ui";
import type { PropertyWithImages } from "@/types";

interface PropertyAgentCardProps {
  property: PropertyWithImages;
}

export function PropertyAgentCard({ property }: PropertyAgentCardProps) {
  const agentName = property.agent_contact?.full_name?.trim() || "Verified Agent";
  const businessName = property.agent_contact?.business_name?.trim() || "Renyt Partner Agent";

  if (!property.agent_contact?.full_name && !property.agent_contact?.business_name && !property.agent_contact?.avatar_url) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-[var(--color-deep-slate-blue)]/10 bg-[linear-gradient(180deg,rgba(30,58,95,0.04),rgba(255,255,255,1))]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={property.agent_contact?.avatar_url ?? null}
            fallback={agentName}
            alt={agentName}
            size="lg"
            className="h-20 w-20 text-xl ring-4 ring-white shadow-sm"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
              Listed by
            </p>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {agentName}
            </h3>
            <p className="break-words text-sm text-[var(--color-text-secondary)]">{businessName}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* <Badge variant="verified" size="sm">
                Renyt agent identity on file
              </Badge> */}
              {property.is_verified && (
                <Badge variant="info" size="sm">
                  Listing verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Contact actions on this page route directly to the verified listing agent by WhatsApp or phone.
        </div> */}
      </CardContent>
    </Card>
  );
}