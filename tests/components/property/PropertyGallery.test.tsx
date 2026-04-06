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

  it("opens fullscreen viewer when main image is clicked", () => {
    render(<PropertyGallery images={images as any} title="Lekki apartment" />);

    // Click the main image area
    const mainImageButton = screen.getByRole("button", {
      name: /lekki apartment - photo 1/i,
    });
    fireEvent.click(mainImageButton);

    // Fullscreen dialog should appear
    const dialog = screen.getByRole("dialog", {
      name: /fullscreen image viewer/i,
    });
    expect(dialog).toBeInTheDocument();

    // Should show image counter
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    // Close button should be present
    expect(
      screen.getByRole("button", { name: /close fullscreen/i }),
    ).toBeInTheDocument();
  });

  it("navigates images in fullscreen and closes with close button", () => {
    render(<PropertyGallery images={images as any} title="Lekki apartment" />);

    // Open fullscreen
    fireEvent.click(
      screen.getByRole("button", { name: /lekki apartment - photo 1/i }),
    );

    // Navigate to next image
    fireEvent.click(screen.getByRole("button", { name: /^next image$/i }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();

    // Close fullscreen
    fireEvent.click(
      screen.getByRole("button", { name: /close fullscreen/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: /fullscreen image viewer/i }),
    ).not.toBeInTheDocument();
  });

  it("closes fullscreen viewer on Escape key", () => {
    render(<PropertyGallery images={images as any} title="Lekki apartment" />);

    fireEvent.click(
      screen.getByRole("button", { name: /lekki apartment - photo 1/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});