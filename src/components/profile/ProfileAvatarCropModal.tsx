"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Move, ZoomIn } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  clampAvatarCropState,
  createDefaultAvatarCropState,
  getAvatarCropBounds,
  renderAvatarCropToBase64,
  type AvatarCropState,
} from "@/lib/profileAvatar";

const PREVIEW_SIZE = 320;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface PointerPosition {
  x: number;
  y: number;
}

interface PinchState {
  initialDistance: number;
  initialZoom: number;
  initialOffsetX: number;
  initialOffsetY: number;
  initialCenterX: number;
  initialCenterY: number;
}

interface ProfileAvatarCropModalProps {
  isOpen: boolean;
  file: File | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    file_name: string;
    content_type: string;
    base64_data: string;
  }) => Promise<void> | void;
}

export function ProfileAvatarCropModal({
  isOpen,
  file,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ProfileAvatarCropModalProps) {
  const [crop, setCrop] = useState<AvatarCropState>(createDefaultAvatarCropState());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const activePointers = useRef<Map<number, PointerPosition>>(new Map());
  const pinchState = useRef<PinchState | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) {
      return "";
    }

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setCrop(createDefaultAvatarCropState());
    setImageLoaded(false);
    setNaturalSize({ width: 1, height: 1 });
    setError("");
  }, [file, isOpen]);

  const bounds = getAvatarCropBounds(
    naturalSize.width,
    naturalSize.height,
    crop.zoom,
    PREVIEW_SIZE,
  );
  const displayWidth = naturalSize.width * bounds.scale * crop.zoom;
  const displayHeight = naturalSize.height * bounds.scale * crop.zoom;

  function handleZoomChange(nextZoom: number) {
    setCrop((current) =>
      clampAvatarCropState(
        {
          ...current,
          zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)),
        },
        naturalSize.width,
        naturalSize.height,
        PREVIEW_SIZE,
      ),
    );
  }

  function getPinchSnapshot() {
    const points = Array.from(activePointers.current.values());
    if (points.length < 2) {
      return null;
    }

    const [a, b] = points;
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    return {
      distance: Math.hypot(dx, dy),
      centerX: (a.x + b.x) / 2,
      centerY: (a.y + b.y) / 2,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageLoaded) {
      return;
    }

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (activePointers.current.size === 1) {
      dragState.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      pinchState.current = null;
    }

    if (activePointers.current.size >= 2) {
      const pinchSnapshot = getPinchSnapshot();
      if (pinchSnapshot) {
        pinchState.current = {
          initialDistance: Math.max(1, pinchSnapshot.distance),
          initialZoom: crop.zoom,
          initialOffsetX: crop.offsetX,
          initialOffsetY: crop.offsetY,
          initialCenterX: pinchSnapshot.centerX,
          initialCenterY: pinchSnapshot.centerY,
        };
      }
      dragState.current = null;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!activePointers.current.has(event.pointerId)) {
      return;
    }

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (activePointers.current.size >= 2) {
      const pinchSnapshot = getPinchSnapshot();
      const pinch = pinchState.current;

      if (!pinchSnapshot || !pinch) {
        return;
      }

      const zoomScale = pinchSnapshot.distance / pinch.initialDistance;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.initialZoom * zoomScale));
      const offsetDeltaX = pinchSnapshot.centerX - pinch.initialCenterX;
      const offsetDeltaY = pinchSnapshot.centerY - pinch.initialCenterY;

      setCrop((current) =>
        clampAvatarCropState(
          {
            ...current,
            zoom: nextZoom,
            offsetX: pinch.initialOffsetX + offsetDeltaX,
            offsetY: pinch.initialOffsetY + offsetDeltaY,
          },
          naturalSize.width,
          naturalSize.height,
          PREVIEW_SIZE,
        ),
      );
      return;
    }

    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.current.x;
    const deltaY = event.clientY - dragState.current.y;

    dragState.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    setCrop((current) =>
      clampAvatarCropState(
        {
          ...current,
          offsetX: current.offsetX + deltaX,
          offsetY: current.offsetY + deltaY,
        },
        naturalSize.width,
        naturalSize.height,
        PREVIEW_SIZE,
      ),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointers.current.delete(event.pointerId);

    if (activePointers.current.size >= 2) {
      const pinchSnapshot = getPinchSnapshot();
      if (pinchSnapshot) {
        pinchState.current = {
          initialDistance: Math.max(1, pinchSnapshot.distance),
          initialZoom: crop.zoom,
          initialOffsetX: crop.offsetX,
          initialOffsetY: crop.offsetY,
          initialCenterX: pinchSnapshot.centerX,
          initialCenterY: pinchSnapshot.centerY,
        };
      }
      dragState.current = null;
      return;
    }

    pinchState.current = null;

    const remainingPointer = activePointers.current.entries().next();
    if (!remainingPointer.done) {
      const [pointerId, pointer] = remainingPointer.value;
      dragState.current = {
        pointerId,
        x: pointer.x,
        y: pointer.y,
      };
      return;
    }

    dragState.current = null;
  }

  async function handleConfirm() {
    if (!file || !imageRef.current) {
      return;
    }

    setError("");

    try {
      const base64Data = await renderAvatarCropToBase64({
        image: imageRef.current,
        mimeType: file.type,
        crop,
        previewSize: PREVIEW_SIZE,
      });

      await onConfirm({
        file_name: file.name,
        content_type: file.type,
        base64_data: base64Data,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not prepare this headshot",
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop your headshot"
      dialogClassName="max-w-2xl"
      className="space-y-5"
    >
      <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
        <p>Center your face inside the square crop. Drag to reposition and use zoom if needed.</p>
        <p>On mobile, use two fingers to pinch and zoom.</p>
        <p>Use a professional headshot on a plain white background.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div
            className="relative mx-auto overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,#f8fafc,white_65%)] shadow-inner"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {previewUrl ? (
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Avatar crop preview"
                onLoad={(event) => {
                  setImageLoaded(true);
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                }}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(calc(-50% + ${crop.offsetX}px), calc(-50% + ${crop.offsetY}px))`,
                }}
                draggable={false}
              />
            ) : null}

            <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/70" />
            <div className="pointer-events-none absolute inset-6 rounded-[1.5rem] border border-dashed border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.32)]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <Move className="h-3.5 w-3.5" />
            Drag the image to frame your face naturally.
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-gray-50 p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Preview rules</p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>Face should be fully visible.</li>
              <li>Keep shoulders and upper chest in frame.</li>
              <li>Avoid dark or busy backgrounds.</li>
            </ul>
          </div>

          <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
            <span className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Zoom
            </span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.01"
              value={crop.zoom}
              onChange={(event) => handleZoomChange(Number(event.target.value))}
              className="w-full accent-[var(--color-deep-slate-blue)]"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-[var(--color-rejected)]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleConfirm} isLoading={isSubmitting} disabled={!file || !imageLoaded}>
              Use Cropped Headshot
            </Button>
            <Button variant="secondary" onClick={onClose} type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}