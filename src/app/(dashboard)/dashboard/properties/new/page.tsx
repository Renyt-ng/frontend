import type { Metadata } from "next";
import { PropertyComposer } from "../PropertyComposer";

export const metadata: Metadata = {
  title: "Create Property Draft",
};

export default function NewPropertyPage() {
  return <PropertyComposer />;
}
