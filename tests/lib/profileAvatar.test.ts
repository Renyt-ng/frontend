import { describe, expect, it } from "vitest";
import {
  clampAvatarCropState,
  getAvatarCropBounds,
  validateProfileAvatarFile,
} from "@/lib/profileAvatar";

describe("profileAvatar validation", () => {
  it("rejects unsupported file types", () => {
    const file = new File(["avatar"], "avatar.gif", { type: "image/gif" });
    expect(validateProfileAvatarFile(file)).toBe("Upload a JPG, PNG, or WebP image.");
  });

  it("rejects files larger than 5MB", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.jpg", {
      type: "image/jpeg",
    });
    expect(validateProfileAvatarFile(file)).toBe("Profile photo must be 5MB or smaller.");
  });

  it("accepts jpg png and webp files within the size limit", () => {
    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });
    expect(validateProfileAvatarFile(file)).toBeNull();
  });

  it("calculates crop bounds from the shortest image edge", () => {
    const bounds = getAvatarCropBounds(1200, 1600, 1.5);

    expect(bounds.scale).toBeCloseTo(320 / 1200);
    expect(bounds.maxOffsetX).toBeGreaterThan(0);
    expect(bounds.maxOffsetY).toBeGreaterThanOrEqual(0);
  });

  it("clamps crop offsets so the preview never exposes empty space", () => {
    const crop = clampAvatarCropState(
      {
        zoom: 1.2,
        offsetX: 400,
        offsetY: -400,
      },
      1200,
      1200,
    );

    expect(crop.offsetX).toBeLessThanOrEqual(32);
    expect(crop.offsetY).toBeGreaterThanOrEqual(-32);
  });
});