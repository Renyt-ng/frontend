"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

export default function PropertyApplyPage() {
  const params = useParams<{ id: string }>();
  const propertyId = typeof params.id === "string" ? params.id : "";

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
            This listing now uses direct agent contact
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Public listing journeys no longer use rental application forms at launch. Return to the property page and use Message Agent to continue on WhatsApp.
          </p>
          <Link href={`/properties/${propertyId}`}>
            <Button>
              <MessageCircle className="h-4 w-4" />
              Return to Message Agent
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}