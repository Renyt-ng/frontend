"use client";

interface WalkthroughVideoPlayerProps {
  src: string;
  type: string;
  title: string;
}

export function WalkthroughVideoPlayer({
  src,
  type,
  title,
}: WalkthroughVideoPlayerProps) {
  return (
    <video
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      playsInline
      preload="metadata"
      className="w-full"
      aria-label={`${title} walkthrough video`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <source src={src} type={type} />
    </video>
  );
}