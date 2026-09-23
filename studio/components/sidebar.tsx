"use client";

import { PanelLeftClose, PanelLeftOpen, Search, Settings } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { CategoryIcon } from "./category-icon";
import { cn } from "../lib/cn";
import type { Category } from "../lib/types";
import { displayName, displayRole, profileInitial, type Profile } from "../lib/profile";

type SidebarProps = {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  counts: Record<string, number>;
  collapsed: boolean;
  onToggle: () => void;
  profile: Profile;
  onOpenSettings: () => void;
  search: string;
  onSearch: (value: string) => void;
};

export function Sidebar({
  categories,
  activeId,
  onSelect,
  counts,
  collapsed,
  onToggle,
  profile,
  onOpenSettings,
  search,
  onSearch,
}: SidebarProps) {
  const initial = profileInitial(profile);
  const query = search.trim().toLowerCase();
  const visible = query
    ? categories.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.items.some(
            (i) => i.title.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)
          )
      )
    : categories;

  return (
    <aside
      className="relative z-20 flex h-dvh shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
      style={{ width: collapsed ? 76 : 272 }}
      aria-label="Checklist navigation"
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-4 pt-5 pb-4", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className="group relative grid size-9 shrink-0 place-items-center rounded-xl"
          >
            <BrandLogo size={36} className="transition-opacity duration-150 group-hover:opacity-0" />
            <PanelLeftOpen className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 scale-90 opacity-0 transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100" />
          </button>
        ) : (
          <>
            <BrandLogo size={36} />
            <div className="min-w-0 leading-tight transition-opacity duration-200 opacity-100">
              <p className="truncate font-display text-[13px] font-semibold tracking-tight">
                front end checklist
              </p>
              <p className="truncate text-[11px] text-foreground-subtle">studio</p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              aria-expanded={true}
              className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Search */}
      <div className={cn("px-3 pb-3", collapsed && "px-3")}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Search checklist"
            className="grid size-9 w-full place-items-center rounded-lg border border-border bg-background text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
        ) : (
          <div className="group flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-accent">
            <Search className="size-3.5 shrink-0 text-foreground-subtle" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search checklist..."
              className="h-full w-full min-w-0 bg-transparent text-[13px] outline-none"
            />
            <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground-subtle">
              Ctrl K
            </kbd>
          </div>
        )}
      </div>

      {/* Categories */}
      <nav className="scrollbar-none flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {visible.map((c) => {
          const active = c.id === activeId;
          const done = counts[c.id] ?? 0;
          const total = c.items.length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              title={collapsed ? c.title : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors duration-150",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-foreground"
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-accent" />
              )}
              <CategoryIcon
                id={c.id}
                className={cn(
                  "size-[18px] transition-colors",
                  active ? "text-accent" : "text-foreground-subtle group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] font-medium transition-opacity duration-200",
                  collapsed && "hidden"
                )}
              >
                {c.title}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] tabular-nums transition-colors",
                  active ? "text-accent" : "text-foreground-subtle",
                  collapsed && "hidden"
                )}
              >
                {done}
                <span className="text-foreground-subtle">/{total}</span>
              </span>
            </button>
          );
        })}
        {visible.length === 0 && !collapsed && (
          <p className="px-3 py-6 text-center text-xs text-foreground-subtle">No matches</p>
        )}
      </nav>

      {/* Profile */}
      <div className="border-t border-border p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "flex-col gap-2")}>
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border-strong bg-surface-hover font-display text-[13px] font-semibold text-foreground-muted">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="" className="size-full object-cover" />
            ) : initial ? (
              initial
            ) : (
              <span className="size-2 rounded-full bg-foreground-subtle" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{displayName(profile)}</p>
              <p className="truncate text-[11px] text-foreground-subtle">{displayRole(profile)}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground",
              collapsed ? "" : "ml-auto"
            )}
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
