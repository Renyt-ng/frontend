"use client";

import { AdminReferralReview, ReferralDashboardView } from "@/components/referrals";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardReferralsPage() {
  const role = useAuthStore((state) => state.user?.role ?? "tenant");

  if (role === "admin") {
    return <AdminReferralReview />;
  }

  return <ReferralDashboardView />;
}