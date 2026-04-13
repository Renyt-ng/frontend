import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

const options = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

describe("Select", () => {
  it("renders the placeholder text before a value is chosen", () => {
    render(<Select options={options} placeholder="Choose status" value="" />);

    expect(screen.getByRole("button")).toHaveTextContent("Choose status");
  });

  it("opens the listbox and calls onChange with the selected value", () => {
    const handleChange = vi.fn();

    render(
      <Select
        options={options}
        value="draft"
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Active" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]?.[0].target.value).toBe("active");
  });

  it("supports keyboard selection", () => {
    const handleChange = vi.fn();

    render(
      <Select
        options={options}
        value="draft"
        onChange={handleChange}
      />,
    );

    const trigger = screen.getByRole("button");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(handleChange.mock.calls[0]?.[0].target.value).toBe("active");
  });

  it("closes when a pointer event happens outside the listbox", () => {
    render(<Select options={options} value="draft" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});