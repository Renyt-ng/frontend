export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Agent {
  id: string;
  user_id: string;
  verification_status: VerificationStatus;
  business_name: string;
  business_address: string;
  id_document_url: string;
  phone_verified: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

/** Agent with joined profile for display */
export interface AgentWithProfile extends Agent {
  profile: {
    full_name: string;
    phone: string;
  };
}
