import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Activity, ShieldCheck } from "lucide-react";
import {
  DashboardContextualHelp,
  DashboardListSkeleton,
  DashboardPanel,
  DashboardSectionHeading,
  DashboardSectionNav,
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

  it("renders section heading helper content", () => {
    const { container } = render(
      <DashboardSectionHeading
        title="Operations"
        helper={<span>Helper</span>}
      />,
    );

    expect(screen.getByText("Helper")).toBeTruthy();
    expect(container.querySelector(".items-center")).toBeTruthy();
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
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("renders visible values when chart data exists", () => {
    const { container } = render(
      <MiniBarChart
        ariaLabel="Active chart"
        values={[4, 2, 1, 3]}
        labels={["One", "Two", "Three", "Four"]}
      />,
    );

    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.queryByText(/No volume yet/i)).toBeNull();

    const valuedBars = container.querySelectorAll('[data-bar-state="value"]');
    expect(valuedBars.length).toBe(4);
    expect(valuedBars[1]).toHaveClass("bg-[var(--dashboard-accent)]");
    expect(container.querySelector(".basis-0")).toBeTruthy();
    expect(container.querySelector(".truncate")).toBeTruthy();
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

  it("renders a configurable dashboard list skeleton", () => {
    const { container } = render(
      <DashboardListSkeleton rows={4} itemClassName="h-12" />,
    );

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);
  });

  it("reveals contextual help content when toggled", () => {
    render(
      <DashboardContextualHelp label="More information" title="Why this matters">
        This metric updates after each review cycle.
      </DashboardContextualHelp>,
    );

    fireEvent.click(screen.getByRole("button", { name: "More information" }));

    expect(screen.getByRole("tooltip")).toHaveClass(
      "max-w-[calc(100vw-2rem)]",
    );
    expect(screen.getByText("Why this matters")).toBeTruthy();
    expect(
      screen.getByText("This metric updates after each review cycle."),
    ).toBeTruthy();
  });

  it("marks the clicked section as active in section navigation", () => {
    render(
      <DashboardSectionNav
        items={[
          { id: "health", label: "Health", count: 3 },
          { id: "events", label: "Events", count: 12 },
        ]}
      />,
    );

    const eventsLink = screen.getByRole("link", { name: /Events/i });
    fireEvent.click(eventsLink);

    expect(eventsLink).toHaveAttribute("href", "#events");
    expect(eventsLink).toHaveAttribute("aria-current", "true");
    expect(eventsLink).toHaveClass("snap-start");
  });
});