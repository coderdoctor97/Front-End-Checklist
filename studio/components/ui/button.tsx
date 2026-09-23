"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover shadow-[0_1px_0_0_color-mix(in_oklab,var(--accent)_60%,white)]",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-hover hover:border-border-strong",
  ghost: "bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground",
  danger:
    "bg-transparent text-critical border border-[color-mix(in_oklab,var(--critical)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--critical)_14%,transparent)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9.5 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2",
  icon: "h-9.5 w-9.5 rounded-lg justify-center",
  "icon-sm": "h-8 w-8 rounded-lg justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-[background-color,border-color,color,transform,opacity] duration-150",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
