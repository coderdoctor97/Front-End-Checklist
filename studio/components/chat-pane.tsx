"use client";

import { useRef } from "react";
import { Bot, ChevronRight, Code2, ImageIcon, Paperclip, Send, SlidersHorizontal, X } from "lucide-react";
import { Markdown } from "./Markdown";
import { Button } from "./ui/button";
import { cn } from "../lib/cn";
import { profileInitial, type Profile } from "../lib/profile";
import type { ChatMessage, RepoRef } from "../lib/types";
import type { SettingsTab } from "./settings-modal";

const PANEL_WIDTH = 384;

type ChatPaneProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  messages: ChatMessage[];
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
  busy: boolean;
  aiReady: boolean;
  selectedRepo: RepoRef | null;
  pasteUrl: string;
  onPasteUrl: (value: string) => void;
  onApplyRepo: () => void;
  profile: Profile;
  modelLabel: string;
  onOpenSettings: (tab?: SettingsTab) => void;
  overlay?: boolean;
};

function timeOf(at?: number): string {
  if (!at) return "";
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatPane(props: ChatPaneProps) {
  const {
    collapsed,
    onToggleCollapsed,
    messages,
    input,
    onInput,
    onSend,
    onClear,
    busy,
    aiReady,
    selectedRepo,
    pasteUrl,
    onPasteUrl,
    onApplyRepo,
    profile,
    modelLabel,
    onOpenSettings,
    overlay = false,
  } = props;

  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initial = profileInitial(profile);
  const disabled = !aiReady || !selectedRepo;

  function insert(snippet: string) {
    const el = inputRef.current;
    if (!el) {
      onInput(input + snippet);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    onInput(input.slice(0, start) + snippet + input.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => insert(`\n${String(reader.result ?? "")}`);
    reader.readAsText(file);
    e.target.value = "";
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start gap-2.5 border-b border-border px-4 py-3.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-accent">
          <Bot className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">Chat</h2>
          <p className="text-[11px] leading-snug text-foreground-subtle">
            Chat with your provider. Prompts are meant to be copied into Cursor, Claude Code, or similar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenSettings("ai")}
          aria-label="Chat mode and provider"
          title={`Mode: ${modelLabel}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse chat"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          {overlay ? <X className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {/* Messages */}
      <div className="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!selectedRepo && (
          <div className="rounded-xl border border-border bg-background p-3.5">
            <p className="text-[13px] font-medium">Select a repository before chatting</p>
            <div className="mt-2.5 flex flex-col gap-1.5">
              <label className="text-[11px] text-foreground-subtle" htmlFor="repo-url">
                Paste GitHub URL or owner/name
              </label>
              <input
                id="repo-url"
                value={pasteUrl}
                onChange={(e) => onPasteUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-accent"
              />
            </div>
            <Button size="sm" variant="secondary" className="mt-2.5" onClick={onApplyRepo}>
              Use this repo
            </Button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-accent">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-medium text-foreground-muted">AI</p>
              <div className="rounded-2xl border border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground-muted">
                Hi! I&apos;m your AI assistant. Configure a provider and pick a repository, then ask me how to
                implement any rule.
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          if (m.role === "system") return null;
          return (
            <div key={i} className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border text-[12px] font-semibold",
                  isUser
                    ? "border-border-strong bg-surface-hover font-display text-foreground-muted"
                    : "border-border bg-background text-accent"
                )}
              >
                {isUser ? (
                  profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="" className="size-full object-cover" />
                  ) : initial ? (
                    initial
                  ) : (
                    <span className="size-1.5 rounded-full bg-foreground-subtle" />
                  )
                ) : (
                  <Bot className="size-4" />
                )}
              </div>
              <div className={cn("min-w-0 max-w-[86%]", isUser && "flex flex-col items-end")}>
                <div
                  className={cn(
                    "mb-1 flex items-center gap-2 text-[11px] text-foreground-subtle",
                    isUser && "flex-row-reverse"
                  )}
                >
                  <span className="font-medium text-foreground-muted">{isUser ? "You" : "AI"}</span>
                  {m.at && <span className="tabular-nums">{timeOf(m.at)}</span>}
                </div>
                <div
                  className={cn(
                    "w-fit rounded-2xl border px-3.5 py-2.5 text-left text-[13px] leading-relaxed",
                    isUser
                      ? "border-transparent bg-[color-mix(in_oklab,var(--accent)_18%,transparent)]"
                      : "border-border bg-background"
                  )}
                >
                  {isUser ? m.content : <Markdown>{m.content}</Markdown>}
                </div>
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 pl-11 text-[12px] text-foreground-subtle">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            Thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="rounded-xl border border-border bg-background focus-within:border-accent">
          <textarea
            ref={inputRef}
            rows={3}
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={
              aiReady
                ? selectedRepo
                  ? "Type your message…"
                  : "Select a repository first"
                : "Configure an AI provider first"
            }
            disabled={disabled}
            className="scrollbar-none w-full resize-none bg-transparent px-3.5 py-3 text-[13px] leading-relaxed outline-none disabled:opacity-60"
          />
          <div className="flex items-center gap-0.5 px-2 pb-2">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.css,.html"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label="Attach a text file"
              title="Attach a text file"
              className="grid size-8 place-items-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40"
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => insert("![alt text](https://)")}
              disabled={disabled}
              aria-label="Insert image"
              title="Insert image markdown"
              className="grid size-8 place-items-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40"
            >
              <ImageIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => insert("\n```\n\n```\n")}
              disabled={disabled}
              aria-label="Insert code block"
              title="Insert code block"
              className="grid size-8 place-items-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40"
            >
              <Code2 className="size-4" />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onClear} disabled={messages.length === 0}>
                Clear
              </Button>
              <Button size="sm" variant="primary" onClick={onSend} disabled={disabled || busy || !input.trim()}>
                <Send className="size-3.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (overlay) {
    return (
      <>
        <div
          className="animate-fade fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onToggleCollapsed}
          role="presentation"
        />
        <aside className="animate-pop fixed inset-y-0 right-0 z-40 flex h-dvh w-[min(384px,88vw)] flex-col overflow-hidden border-l border-border bg-surface shadow-2xl">
          {content}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "relative z-20 h-dvh shrink-0 overflow-hidden bg-surface transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        collapsed ? "border-l-0" : "border-l border-border"
      )}
      style={{ width: collapsed ? 0 : PANEL_WIDTH }}
      aria-hidden={collapsed}
    >
      <div className="flex h-full flex-col" style={{ width: PANEL_WIDTH }}>
        {content}
      </div>
    </aside>
  );
}
