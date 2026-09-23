"use client";

import { cn } from "../lib/cn";

/**
 * Monochrome category glyph. The uploaded SVGs are used as a CSS mask and
 * painted with `currentColor`, so every icon follows the active theme.
 */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const url = `/icons/${id}.svg`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: `url("${url}")`,
        maskImage: `url("${url}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

/** Full-colour brand logo, used only in the dashboard heading. */
export function CategoryLogo({
  id,
  className,
  alt = "",
}: {
  id: string;
  className?: string;
  alt?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logos/${id}.png`} alt={alt} className={cn("object-contain", className)} />;
}
