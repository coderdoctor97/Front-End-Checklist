"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ProfileSettings } from "./settings/profile-settings";
import { AppearanceSettings } from "./settings/appearance-settings";
import { AiGithubSettings, type AiGithubSettingsProps } from "./settings/ai-github-settings";
import { cn } from "../lib/cn";
import type { Profile } from "../lib/profile";

export type SettingsTab = "profile" | "appearance" | "ai";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "ai", label: "AI & GitHub" },
];

type SettingsModalProps = {
  open: boolean;
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  onClose: () => void;
  profile: Profile;
  onProfile: (profile: Profile) => void;
  ai: AiGithubSettingsProps;
  error?: string;
};

export function SettingsModal({ open, tab, onTab, onClose, profile, onProfile, ai, error }: SettingsModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop my-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="ml-auto grid size-8 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-3 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn(
                "relative rounded-t-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                tab === t.id ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              )}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          {error && (
            <div className="mb-5 rounded-lg border border-[color-mix(in_oklab,var(--critical)_45%,transparent)] bg-[color-mix(in_oklab,var(--critical)_10%,transparent)] px-3.5 py-2.5 text-[12.5px] text-critical">
              {error}
            </div>
          )}
          {tab === "profile" && <ProfileSettings profile={profile} onChange={onProfile} />}
          {tab === "appearance" && <AppearanceSettings />}
          {tab === "ai" && <AiGithubSettings {...ai} />}
        </div>
      </div>
    </div>
  );
}
