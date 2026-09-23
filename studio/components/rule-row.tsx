"use client";

import { Bot, Check, CircleHelp } from "lucide-react";
import { cn } from "../lib/cn";
import type { ChecklistItem, Priority } from "../lib/types";

const priorityLabel: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type RuleRowProps = {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  onExplain: () => void;
  onGenerate: () => void;
  aiReady: boolean;
  busy: boolean;
  index: number;
};

export function RuleRow({
  item,
  checked,
  onToggle,
  onExplain,
  onGenerate,
  aiReady,
  busy,
  index,
}: RuleRowProps) {
  return (
    <article
      className="animate-rise group relative flex items-start gap-3.5 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
      style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Mark "${item.title}" complete`}
        onClick={onToggle}
        className={cn(
          "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition-all duration-150",
          checked
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border-strong bg-background text-transparent hover:border-accent"
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "block text-left font-display text-[14.5px] font-semibold tracking-tight transition-colors",
            checked ? "text-foreground-subtle line-through" : "text-foreground"
          )}
        >
          {item.title}
        </button>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground-muted">{item.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-center">
        <button
          type="button"
          onClick={onExplain}
          title="Explain this rule"
          aria-label="Explain this rule"
          className="grid size-8 place-items-center rounded-lg text-accent transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
        >
          <CircleHelp className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!aiReady || busy}
          title={aiReady ? "Generate an implementation prompt" : "Configure an AI provider first"}
          aria-label="Generate implementation prompt"
          className="grid size-8 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Bot className="size-[18px]" />
        </button>
        <span className={cn("pill", `pill-${item.priority}`)}>
          <span className={cn("dot", `dot-${item.priority}`)} />
          {priorityLabel[item.priority]}
        </span>
      </div>
    </article>
  );
}
