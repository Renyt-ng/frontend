import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Activity, ShieldCheck } from "lucide-react";
import {
  DashboardPanel,
  DashboardSectionHeading,
  MetricCard,
  MiniBarChart,
  StatusPanel,
} from "@/components/dashboard";

describe("Dashboard primitives", () => {
  it("renders a panel with content", () => {
    render(<DashboardPanel>Panel content</DashboardPanel>);
    expect(screen.getByText("Panel content")).toBeTruthy();
  });

  it("renders section heading title and description", () => {
    render(
      <DashboardSectionHeading
        title="Operations"
        description="High-signal workflow summary"
      />,
    );

    expect(screen.getByText("Operations")).toBeTruthy();
    expect(screen.getByText("High-signal workflow summary")).toBeTruthy();
  });

  it("renders metric card as a link when href is provided", { timeout: 10000 }, () => {
    render(
      <MetricCard
        icon={Activity}
        label="Pending verifications"
        value={12}
        meta="Needs review"
        href="/dashboard/verifications"
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/verifications",
    );
    expect(screen.getByText("Pending verifications")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders chart placeholder copy when values are empty", () => {
    render(
      <MiniBarChart
        ariaLabel="Empty chart"
        values={[0, 0, 0, 0]}
        labels={["One", "Two", "Three", "Four"]}
      />,
    );

    expect(screen.getByRole("img", { name: "Empty chart" })).toBeTruthy();
    expect(
      screen.getByText(/No volume yet. This panel will populate/i),
    ).toBeTruthy();
  });

  it("renders status panel with badge and action", () => {
    render(
      <StatusPanel
        icon={ShieldCheck}
        title="Verification queue"
        description="Queue is under review"
        badgeLabel="Needs review"
        action={<button type="button">Open queue</button>}
      />,
    );

    expect(screen.getByText("Verification queue")).toBeTruthy();
    expect(screen.getByText("Needs review")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open queue" })).toBeTruthy();
  });
});