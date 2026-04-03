import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WalkthroughVideoPlayer } from "@/components/property/WalkthroughVideoPlayer";

describe("WalkthroughVideoPlayer", () => {
  it("applies browser-side download restrictions to walkthrough videos", () => {
    render(
      <WalkthroughVideoPlayer
        src="https://cdn.renyt.ng/property.mp4"
        type="video/mp4"
        title="Lekki Apartment"
      />,
    );

    const video = screen.getByLabelText(/lekki apartment walkthrough video/i);

    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("controlsList", "nodownload noremoteplayback");
    expect(video).toHaveAttribute("disablePictureInPicture");
    expect(video).toHaveAttribute("disableRemotePlayback");
    expect(video).toHaveAttribute("playsInline");
  });

  it("blocks the default context menu on the video element", () => {
    render(
      <WalkthroughVideoPlayer
        src="https://cdn.renyt.ng/property.mp4"
        type="video/mp4"
        title="Lekki Apartment"
      />,
    );

    const video = screen.getByLabelText(/lekki apartment walkthrough video/i);
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    video.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    fireEvent.contextMenu(video);
  });
});