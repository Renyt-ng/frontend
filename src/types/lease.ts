export type LeaseStatus = "draft" | "sent" | "signed" | "cancelled";

export interface Lease {
  id: string;
  property_id: string;
  tenant_id: string;
  agent_id: string;
  application_id: string;
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: number;
  terms: string;
  status: LeaseStatus;
  created_at: string;
}

export interface LeaseSignature {
  id: string;
  lease_id: string;
  signed_by: string;
  signature_timestamp: string;
  ip_address: string;
  created_at: string;
}
