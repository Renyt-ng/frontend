import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/layout/Footer";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img alt={props.alt} />,
}));

vi.mock("@/lib/hooks", () => ({
  useLocations: () => ({
    data: {
      data: [
        {
          id: "loc-1",
          name: "Lekki",
        },
      ],
    },
  }),
}));

describe("Footer", () => {
  it("links How It Works to the homepage section and removes FAQ", () => {
    render(<Footer />);

    expect(document.getElementById("site-footer")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
    expect(screen.queryByRole("link", { name: /faqs/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /for agents/i })).toHaveAttribute(
      "href",
      "/agents",
    );
    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
  }, 20000);
});