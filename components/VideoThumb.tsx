"use client";

import { useRef, useState } from "react";
import { hasPreview, type Element } from "@/lib/types";

// Small preview tile used in the results list: shows the first frame (via
// the still preview image if there is one, otherwise the paused preview
// video) and plays the low-res preview clip on hover.
export default function VideoThumb({ element }: { element: Element }) {
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideo = element.preview_video_rel_path !== null;
  const hasImage = element.preview_image_rel_path !== null;

  if (!hasPreview(element)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-faint text-[9px] uppercase tracking-wide">
        No preview
      </div>
    );
  }

  function handleEnter() {
    setHovering(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }

  function handleLeave() {
    setHovering(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/elements/${element.id}/thumbnail`}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover ${hovering && hasVideo ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {hasVideo && (
        <video
          ref={videoRef}
          src={`/api/elements/${element.id}/preview`}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover ${!hasImage || hovering ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
