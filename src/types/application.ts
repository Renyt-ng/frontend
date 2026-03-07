export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  property_id: string;
  tenant_id: string;
  agent_id: string;
  employment_status: string;
  monthly_income: number;
  guarantor_name: string;
  guarantor_phone: string;
  rental_history: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}
