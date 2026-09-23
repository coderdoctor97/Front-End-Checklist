"use client";

import { useEffect } from "react";
import { Copy, RefreshCw, X } from "lucide-react";
import { Markdown } from "./Markdown";
import { Button } from "./ui/button";
import { cn } from "../lib/cn";
import type { ChecklistItem, PromptModifier } from "../lib/types";

const MODIFIERS: { id: PromptModifier; label: string }[] = [
  { id: "default", label: "Balanced" },
  { id: "think-deeper", label: "Think deeper" },
  { id: "think-longer", label: "Think longer" },
  { id: "shorter", label: "Shorter" },
];

type PromptModalProps = {
  item: ChecklistItem | null;
  generated: string;
  busy: boolean;
  modifier: PromptModifier;
  onModifier: (modifier: PromptModifier) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onClose: () => void;
};

export function PromptModal({
  item,
  generated,
  busy,
  modifier,
  onModifier,
  onRegenerate,
  onCopy,
  onClose,
}: PromptModalProps) {
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Implementation prompt"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop my-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">Implementation prompt</h2>
            <p className="truncate text-[12px] text-foreground-subtle">{item.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
          {MODIFIERS.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={busy}
              onClick={() => {
                onModifier(m.id);
                onRegenerate();
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50",
                modifier === m.id
                  ? "border-accent bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-foreground"
                  : "border-border bg-background text-foreground-muted hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {busy && !generated ? (
            <p className="text-[13px] text-foreground-subtle">Generating…</p>
          ) : (
            <div className="markdown text-[13px] leading-relaxed">
              <Markdown>{generated}</Markdown>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={busy}>
            <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
            Regenerate
          </Button>
          <Button size="sm" variant="primary" onClick={onCopy} disabled={!generated}>
            <Copy className="size-3.5" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
