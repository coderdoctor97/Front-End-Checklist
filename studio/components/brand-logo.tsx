"use client";

import { cn } from "../lib/cn";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

/**
 * Theme-driven brand mark.
 *
 * Renders the Front-End Checklist mark as a PNG. The light and dark variants
 * are swapped purely via CSS using the `data-mode` attribute written onto
 * `<html>` by the layout bootstrap and `applyTheme` in `lib/theme.ts`. Because
 * the bootstrap sets `data-mode` before hydration, the correct variant shows
 * on first paint and follows every theme switch with no JavaScript.
 */
export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn("inline-block shrink-0 leading-none", className)}
      aria-label="Front-End Checklist Studio"
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt=""
        width={size}
        height={size}
        className="block size-full object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt=""
        width={size}
        height={size}
        className="hidden size-full object-contain dark:block"
      />
    </span>
  );
}