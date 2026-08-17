"use client";

import { useCallback, useEffect, useRef } from "react";

type BackgroundVideoProps = {
  src: string;
  className?: string;
};

export function BackgroundVideo({ src, className = "" }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestInlinePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // iOS exige que el video esté silenciado y marcado como inline antes de play().
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    void video.play().catch(() => {
      // Ahorro de batería o datos puede bloquear autoplay. El fondo base permanece visible.
    });
  }, []);

  useEffect(() => {
    const resumeWhenVisible = () => {
      if (document.visibilityState === "visible") requestInlinePlayback();
    };

    requestInlinePlayback();
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", requestInlinePlayback);

    return () => {
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", requestInlinePlayback);
    };
  }, [requestInlinePlayback, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      controls={false}
      disablePictureInPicture
      onCanPlay={requestInlinePlayback}
      className={className}
    />
  );
}
