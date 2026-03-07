import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";

describe("Card", () => {
  it("renders card with content", () => {
    render(
      <Card>
        <CardContent>Hello</CardContent>
      </Card>,
    );
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("renders with all sections", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Test</Card>);
    expect(container.firstElementChild?.className).toContain("custom-class");
  });
});
