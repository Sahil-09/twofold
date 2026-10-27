"use client";

import { useState } from "react";

export function Thumb({
  src,
  alt = "",
  className = "aspect-[4/3] w-full",
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className={`grid place-items-center bg-surface-low text-outline-variant ${className}`}>
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.7-9.3-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.3 12C19.5 16.3 12 21 12 21Z" />
        </svg>
      </div>
    );
  }

  return (
    // Hotlinked on purpose: no image storage in v1.
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setBroken(true)}
      className={`bg-surface-low object-cover ${className}`}
    />
  );
}
