import Image from "next/image";

type AvatarMediaProps = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export function AvatarMedia({ src, alt, sizes = "96px", className = "object-cover" }: AvatarMediaProps) {
  if (isVideoAvatarUrl(src)) {
    return (
      <video
        src={src}
        aria-label={alt}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 size-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      className={className}
    />
  );
}

export function isVideoAvatarUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.searchParams.get("media") === "video" || url.hash === "#media=video";
  } catch {
    return value.includes("media=video");
  }
}
