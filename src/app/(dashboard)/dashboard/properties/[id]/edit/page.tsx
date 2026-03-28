import type { Metadata } from "next";
import { PropertyComposer } from "../../PropertyComposer";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Property Draft",
};

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  return <PropertyComposer propertyId={id} />;
}