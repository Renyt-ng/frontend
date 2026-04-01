import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileAvatarCropModal } from "@/components/profile/ProfileAvatarCropModal";

describe("ProfileAvatarCropModal", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      value: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      value: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      value: vi.fn(() => true),
      configurable: true,
    });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      value() {
        this.open = true;
      },
      configurable: true,
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      value() {
        this.open = false;
      },
      configurable: true,
    });
  });

  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:avatar");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports pinch zoom gestures in the crop area", async () => {
    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

    render(
      <ProfileAvatarCropModal
        isOpen
        file={file}
        onClose={() => {}}
        onConfirm={() => Promise.resolve()}
      />,
    );

    const previewImage = await screen.findByAltText("Avatar crop preview");
    Object.defineProperty(previewImage, "naturalWidth", { value: 1200, configurable: true });
    Object.defineProperty(previewImage, "naturalHeight", { value: 1200, configurable: true });
    fireEvent.load(previewImage);

    const cropSurface = previewImage.parentElement as HTMLElement;
    const zoomSlider = screen.getByRole("slider", { name: /zoom/i }) as HTMLInputElement;

    expect(Number(zoomSlider.value)).toBeCloseTo(1, 2);

    fireEvent.pointerDown(cropSurface, { pointerId: 1, clientX: 120, clientY: 140 });
    fireEvent.pointerDown(cropSurface, { pointerId: 2, clientX: 200, clientY: 140 });
    fireEvent.pointerMove(cropSurface, { pointerId: 2, clientX: 280, clientY: 140 });

    await waitFor(() => {
      expect(Number(zoomSlider.value)).toBeGreaterThan(1);
    });
  });
});
