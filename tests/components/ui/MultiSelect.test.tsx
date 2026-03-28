import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MultiSelect } from "@/components/ui/MultiSelect";

const options = [
  { value: "apartment", label: "Apartment" },
  { value: "duplex", label: "Duplex" },
  { value: "bungalow", label: "Bungalow" },
];

describe("MultiSelect", () => {
  it("shows the empty label when nothing is selected", () => {
    render(
      <MultiSelect options={options} value={[]} emptyLabel="Any" />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Any");
  });

  it("emits the next selected values when an option is chosen", () => {
    const handleChange = vi.fn();

    render(
      <MultiSelect
        options={options}
        value={[]}
        emptyLabel="Any"
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Apartment" }));

    expect(handleChange).toHaveBeenCalledWith(["apartment"]);
  });

  it("clears back to Any when the Any option is chosen", () => {
    const handleChange = vi.fn();

    render(
      <MultiSelect
        options={options}
        value={["apartment", "duplex"]}
        emptyLabel="Any"
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Any" }));

    expect(handleChange).toHaveBeenCalledWith([]);
  });
});