const MAX_PROFILE_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PROFILE_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface AvatarCropBounds {
  maxOffsetX: number;
  maxOffsetY: number;
  scale: number;
}

export interface AvatarCropState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

const AVATAR_CROP_OUTPUT_SIZE = 1024;
const AVATAR_CROP_PREVIEW_SIZE = 320;

export function validateProfileAvatarFile(file: File) {
  if (!ACCEPTED_PROFILE_AVATAR_TYPES.has(file.type)) {
    return "Upload a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_PROFILE_AVATAR_SIZE) {
    return "Profile photo must be 5MB or smaller.";
  }

  return null;
}

export function getAvatarCropBounds(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  previewSize = AVATAR_CROP_PREVIEW_SIZE,
): AvatarCropBounds {
  const safeZoom = Math.max(1, zoom);
  const scale = previewSize / Math.min(imageWidth, imageHeight);
  const scaledWidth = imageWidth * scale * safeZoom;
  const scaledHeight = imageHeight * scale * safeZoom;

  return {
    maxOffsetX: Math.max(0, (scaledWidth - previewSize) / 2),
    maxOffsetY: Math.max(0, (scaledHeight - previewSize) / 2),
    scale,
  };
}

export function clampAvatarCropState(
  crop: AvatarCropState,
  imageWidth: number,
  imageHeight: number,
  previewSize = AVATAR_CROP_PREVIEW_SIZE,
): AvatarCropState {
  const bounds = getAvatarCropBounds(
    imageWidth,
    imageHeight,
    crop.zoom,
    previewSize,
  );

  return {
    zoom: Math.max(1, crop.zoom),
    offsetX: Math.min(bounds.maxOffsetX, Math.max(-bounds.maxOffsetX, crop.offsetX)),
    offsetY: Math.min(bounds.maxOffsetY, Math.max(-bounds.maxOffsetY, crop.offsetY)),
  };
}

export function createDefaultAvatarCropState(): AvatarCropState {
  return {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export async function renderAvatarCropToBase64(options: {
  image: HTMLImageElement;
  mimeType: string;
  crop: AvatarCropState;
  previewSize?: number;
  outputSize?: number;
}) {
  const {
    image,
    mimeType,
    crop,
    previewSize = AVATAR_CROP_PREVIEW_SIZE,
    outputSize = AVATAR_CROP_OUTPUT_SIZE,
  } = options;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize image editor");
  }

  const { scale } = getAvatarCropBounds(
    image.naturalWidth,
    image.naturalHeight,
    crop.zoom,
    previewSize,
  );
  const effectiveScale = scale * Math.max(1, crop.zoom);
  const scaledWidth = image.naturalWidth * effectiveScale;
  const scaledHeight = image.naturalHeight * effectiveScale;
  const sourceX = ((scaledWidth - previewSize) / 2 - crop.offsetX) / effectiveScale;
  const sourceY = ((scaledHeight - previewSize) / 2 - crop.offsetY) / effectiveScale;
  const sourceSize = previewSize / effectiveScale;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL(mimeType).split(",")[1] ?? "";
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image file"));
        return;
      }

      resolve(reader.result.split(",")[1] ?? reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}