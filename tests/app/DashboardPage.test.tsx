import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

const hooks = vi.hoisted(() => ({
  useAdminOverview: vi.fn(),
  useAdminWhatsAppListingCreationReport: vi.fn(),
  useMyProperties: vi.fn(),
  useMyPropertyEngagementSummary: vi.fn(),
  useReferralDashboard: vi.fn(),
}));

const authStore = vi.hoisted(() => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/lib/hooks", () => hooks);
vi.mock("@/stores/authStore", () => authStore);
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    authStore.useAuthStore.mockReturnValue({
      user: {
        role: "admin",
        full_name: "Akaolisa Admin",
      },
    });
    hooks.useAdminOverview.mockReturnValue({
      data: {
        data: {
          metrics: {
            total_listings: 18,
            pending_verifications: 4,
            active_applications: 3,
            signed_leases: 2,
            suspended_users: 1,
          },
          email_health: {
            primary_provider: "ses",
            primary_status: "primary",
            fallback_ready_count: 1,
            degraded_count: 0,
          },
          recent_activity: [],
        },
      },
      isLoading: false,
      isError: false,
    });
    hooks.useAdminWhatsAppListingCreationReport.mockReturnValue({
      data: {
        data: {
          flow_version: "listing_creation_v2",
          summary: {
            active_tasks: 7,
            offered_tasks: 3,
            in_progress_tasks: 4,
            completed_tasks: 2,
            stale_tasks: 2,
            reminders_sent_last_24h: 3,
            publish_ready_drafts: 1,
          },
          step_breakdown: [],
          charts: {
            age_buckets: [
              { label: "<3h", count: 2 },
              { label: "3-12h", count: 2 },
              { label: "12-24h", count: 1 },
              { label: "24h+", count: 2 },
            ],
            reminder_distribution: [
              { label: "0", count: 3 },
              { label: "1", count: 2 },
              { label: "2", count: 1 },
              { label: "3+", count: 1 },
            ],
            pending_field_hotspots: [
              { field: "service_charge", count: 3 },
            ],
          },
          stale_drafts: [],
        },
      },
      isLoading: false,
      isError: false,
    });
    hooks.useMyProperties.mockReturnValue({ data: { data: [] }, isLoading: false });
    hooks.useMyPropertyEngagementSummary.mockReturnValue({ data: { data: {} }, isLoading: false });
    hooks.useReferralDashboard.mockReturnValue({ data: { data: { summary: {} } }, isLoading: false });
  });

  it("renders WhatsApp listing health on the admin dashboard", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /whatsapp listing health/i })).toBeInTheDocument();
    expect(screen.getAllByText(/stale drafts/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/most common missing field/i)).toBeInTheDocument();
    expect(screen.getAllByText(/service charge/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open whatsapp operations/i })).toHaveAttribute(
      "href",
      "/dashboard/whatsapp-settings",
    );
    expect(screen.getByRole("link", { name: /review property verifications/i })).toHaveAttribute(
      "href",
      "/dashboard/verifications?tab=properties",
    );
  }, 20000);
});