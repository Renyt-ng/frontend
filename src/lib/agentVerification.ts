import type {
  AgentVerificationDocumentType,
  AgentVerificationSettings,
} from "@/types";

const DOCUMENT_LABELS: Record<AgentVerificationDocumentType, string> = {
  government_id: "Government ID",
  work_id: "Work ID",
  professional_license: "Professional license",
  proof_of_address: "Proof of address",
};

export function getAgentVerificationDocumentLabel(
  documentType: AgentVerificationDocumentType,
) {
  return DOCUMENT_LABELS[documentType];
}

export function validateAgentVerificationFile(
  file: File,
  settings: Pick<AgentVerificationSettings, "allowed_mime_types" | "max_file_size_mb">,
) {
  if (!settings.allowed_mime_types.includes(file.type)) {
    return "Upload a PDF, JPG, PNG, or WebP file that matches the current verification rules.";
  }

  if (file.size > settings.max_file_size_mb * 1024 * 1024) {
    return `Each verification file must be ${settings.max_file_size_mb}MB or smaller.`;
  }

  return null;
}