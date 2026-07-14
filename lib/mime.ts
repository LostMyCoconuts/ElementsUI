// Shared MIME lookup for the preview-serving routes — only ever covers the
// small set of preview formats we actually stream (never the heavy source
// format files, which are never served over HTTP).
const PREVIEW_VIDEO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const PREVIEW_IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function getPreviewVideoMimeType(extension: string): string {
  return PREVIEW_VIDEO_MIME[extension.toLowerCase()] ?? "video/mp4";
}

export function getPreviewImageMimeType(extension: string): string {
  return PREVIEW_IMAGE_MIME[extension.toLowerCase()] ?? "application/octet-stream";
}
