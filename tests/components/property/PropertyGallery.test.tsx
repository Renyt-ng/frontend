import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropertyGallery } from "@/components/property/PropertyGallery";

const images = [
  { id: "img-1", image_url: "/one.jpg", is_cover: true },
  { id: "img-2", image_url: "/two.jpg", is_cover: false },
  { id: "img-3", image_url: "/three.jpg", is_cover: false },
];

describe("PropertyGallery", () => {
  it("keeps touch navigation controls and snap thumbnails available", () => {
    render(<PropertyGallery images={images as any} title="Lekki apartment" />);

    const nextButton = screen.getByRole("button", {
      name: /next property image/i,
    });

    expect(nextButton).toHaveClass("touch-manipulation");
    expect(nextButton).toHaveClass("opacity-100");

    const thirdThumb = screen.getByRole("button", {
      name: /view property image 3/i,
    });

    expect(thirdThumb).toHaveClass("snap-start");

    fireEvent.click(nextButton);

    expect(screen.getByAltText("Lekki apartment - Photo 2")).toBeInTheDocument();
  });
});