"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5">
      <button
        type="button"
        aria-label="Switch to light theme"
        aria-pressed={mode === "light"}
        onClick={() => setMode("light")}
        className={cn(
          "grid size-7 place-items-center rounded-full transition-colors",
          mode === "light"
            ? "bg-accent text-accent-foreground"
            : "text-foreground-subtle hover:text-foreground"
        )}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Switch to dark theme"
        aria-pressed={mode === "dark"}
        onClick={() => setMode("dark")}
        className={cn(
          "grid size-7 place-items-center rounded-full transition-colors",
          mode === "dark"
            ? "bg-accent text-accent-foreground"
            : "text-foreground-subtle hover:text-foreground"
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}
