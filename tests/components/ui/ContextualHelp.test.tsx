import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextualHelp } from "@/components/ui";

describe("ContextualHelp", () => {
  it("reveals tooltip content when toggled", () => {
    render(
      <ContextualHelp label="More information" title="Why this matters">
        This field controls whether the asking label is shown publicly.
      </ContextualHelp>,
    );

    fireEvent.click(screen.getByRole("button", { name: /more information/i }));

    expect(screen.getByRole("tooltip")).toHaveClass("max-w-[calc(100vw-2rem)]");
    expect(screen.getByText("Why this matters")).toBeInTheDocument();
    expect(
      screen.getByText("This field controls whether the asking label is shown publicly."),
    ).toBeInTheDocument();
  });

  it("closes when a pointer event happens outside the tooltip", () => {
    render(
      <ContextualHelp label="More information" title="Why this matters">
        This field controls whether the asking label is shown publicly.
      </ContextualHelp>,
    );

    fireEvent.click(screen.getByRole("button", { name: /more information/i }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});