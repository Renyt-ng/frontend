export type VerificationStatus = "pending" | "approved" | "rejected";

export type AgentVerificationDocumentType =
  | "government_id"
  | "work_id"
  | "professional_license"
  | "proof_of_address";

export interface AgentVerificationDocument {
  document_type: AgentVerificationDocumentType;
  file_name: string;
  mime_type: string;
  storage_path: string;
  uploaded_at: string;
  signed_url?: string | null;
}

export interface AgentVerificationSettings {
  id: string;
  required_document_types: AgentVerificationDocumentType[];
  allowed_mime_types: string[];
  max_file_size_mb: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  verification_status: VerificationStatus;
  business_name: string;
  business_address: string;
  id_document_url: string | null;
  verification_documents: AgentVerificationDocument[];
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
