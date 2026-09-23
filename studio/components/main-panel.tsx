"use client";

import { useMemo, useState } from "react";
import { Bot, ChevronRight, ChevronLeft, Home, Search, X } from "lucide-react";
import { CategoryLogo } from "./category-icon";
import { ProgressRing } from "./progress-ring";
import { RuleRow } from "./rule-row";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { cn } from "../lib/cn";
import type { Category, ChecklistItem, Priority } from "../lib/types";

type Filter = "all" | Priority;

const FILTERS: { id: Filter; label: string; dot?: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical", dot: "dot-critical" },
  { id: "high", label: "High", dot: "dot-high" },
  { id: "medium", label: "Medium", dot: "dot-medium" },
  { id: "low", label: "Low", dot: "dot-low" },
];

type MainPanelProps = {
  category: Category;
  categoryDone: number;
  totalDone: number;
  total: number;
  checked: Record<string, boolean>;
  onToggleItem: (key: string) => void;
  onExplain: (item: ChecklistItem) => void;
  onGenerate: (item: ChecklistItem) => void;
  aiReady: boolean;
  busy: boolean;
  error: string;
  repoLabel: string;
  modelLabel: string;
  chatCollapsed: boolean;
  onToggleChat: () => void;
  search: string;
  onClearSearch: () => void;
};

export function MainPanel({
  category,
  categoryDone,
  totalDone,
  total,
  checked,
  onToggleItem,
  onExplain,
  onGenerate,
  aiReady,
  busy,
  error,
  repoLabel,
  modelLabel,
  chatCollapsed,
  onToggleChat,
  search,
  onClearSearch,
}: MainPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return category.items;
    return category.items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [category.items, search]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: searched.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const item of searched) base[item.priority] += 1;
    return base;
  }, [searched]);

  const items = useMemo(
    () => (filter === "all" ? searched : searched.filter((i) => i.priority === filter)),
    [searched, filter]
  );

  const categoryProgress = category.items.length ? (categoryDone / category.items.length) * 100 : 0;

  return (
    <main className="relative z-10 flex h-dvh min-w-0 flex-1 flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-5 backdrop-blur-md">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="flex items-center gap-1.5 text-foreground-subtle">
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Home</span>
          </span>
          <ChevronRight className="size-3.5 shrink-0 text-foreground-subtle" />
          <span className="truncate font-medium text-foreground">{category.title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground-muted lg:flex">
            <span
              className={cn(
                "size-1.5 rounded-full",
                repoLabel === "No repo" ? "bg-foreground-subtle" : "bg-low"
              )}
            />
            {repoLabel}
          </span>
          <ThemeToggle />
          {chatCollapsed && (
            <button
              type="button"
              onClick={onToggleChat}
              className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-2.5 pl-1.5 text-[12px] text-foreground-muted transition-colors hover:border-accent hover:text-foreground"
              aria-label="Open AI chat"
            >
              <span className="grid size-6 place-items-center rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-accent">
                <Bot className="size-3.5" />
              </span>
              <span className="font-medium text-foreground">AI</span>
              <span className="max-w-28 truncate text-foreground-subtle">{modelLabel}</span>
              <ChevronLeft className="size-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-6">
          {/* Category header */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-[0.16] blur-3xl"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative flex flex-wrap items-center gap-5">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-border bg-background">
                <CategoryLogo id={category.id} className="size-10" alt={`${category.title} logo`} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[26px] font-semibold tracking-tight">{category.title}</h1>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-foreground-muted">
                  {category.description}
                </p>
                <p className="mt-2 text-[12px] text-foreground-subtle">
                  <span className="font-medium text-foreground-muted">{categoryDone}</span>/{category.items.length} in
                  this category
                  <span className="px-2 text-border-strong">·</span>
                  <span className="font-medium text-foreground-muted">{totalDone}</span>/{total} overall
                </p>
              </div>
              <ProgressRing value={categoryProgress} className="hidden sm:grid" />
            </div>
          </section>

          {/* Filters */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const count = counts[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    active
                      ? "border-accent bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-foreground"
                      : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {f.dot && <span className={cn("dot", f.dot)} />}
                  {f.label}
                  <span className={cn("font-mono text-[11px]", active ? "text-accent" : "text-foreground-subtle")}>
                    ({count})
                  </span>
                </button>
              );
            })}

            {search.trim() && (
              <button
                type="button"
                onClick={onClearSearch}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground-muted transition-colors hover:text-foreground"
              >
                <Search className="size-3.5" />
                “{search.trim()}”
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-[color-mix(in_oklab,var(--critical)_45%,transparent)] bg-[color-mix(in_oklab,var(--critical)_10%,transparent)] px-4 py-3 text-[13px] text-critical">
              {error}
            </div>
          )}

          {/* Rules */}
          <div className="mt-4 space-y-2">
            {items.map((item, index) => {
              const key = `${category.id}:${item.id}`;
              return (
                <RuleRow
                  key={item.id}
                  item={item}
                  index={index}
                  checked={Boolean(checked[key])}
                  onToggle={() => onToggleItem(key)}
                  onExplain={() => onExplain(item)}
                  onGenerate={() => onGenerate(item)}
                  aiReady={aiReady}
                  busy={busy}
                />
              );
            })}
            {items.length === 0 && (
              <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
                <p className="text-sm text-foreground-muted">No rules match this view.</p>
                {filter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                    Show all priorities
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
