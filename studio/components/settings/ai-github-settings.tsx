"use client";

import { GitBranch, KeyRound, PlugZap, Search, Server } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/cn";
import type { AiProvider, RepoRef } from "../../lib/types";
import type { ModelInfo } from "../../lib/openai";

const fieldClass =
  "h-9.5 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition-colors focus:border-accent";
const labelClass = "text-[12px] font-medium text-foreground-muted";

export type AiGithubSettingsProps = {
  draft: AiProvider;
  onDraft: (provider: AiProvider) => void;
  providers: AiProvider[];
  activeProviderId: string;
  onSelectProvider: (id: string) => void;
  onSaveProvider: () => void;
  onLoadModels: () => void;
  models: ModelInfo[];
  modelQuery: string;
  onModelQuery: (value: string) => void;
  modelId: string;
  onSelectModel: (id: string) => void;
  maxTokens: number;
  onMaxTokens: (value: number) => void;
  contextWindow: number;
  onContextWindow: (value: number) => void;
  ghToken: string;
  onGhToken: (value: string) => void;
  ghUser: string;
  onConnectGithub: () => void;
  repoSearch: string;
  onRepoSearch: (value: string) => void;
  onSearchRepos: () => void;
  repos: RepoRef[];
  selectedRepo: RepoRef | null;
  onSelectRepo: (repo: RepoRef) => void;
  pasteUrl: string;
  onPasteUrl: (value: string) => void;
  onApplyPastedRepo: () => void;
  contentMcp: string;
  githubMcp: string;
};

export function AiGithubSettings(props: AiGithubSettingsProps) {
  const {
    draft,
    onDraft,
    providers,
    activeProviderId,
    onSelectProvider,
    onSaveProvider,
    onLoadModels,
    models,
    modelQuery,
    onModelQuery,
    modelId,
    onSelectModel,
    maxTokens,
    onMaxTokens,
    contextWindow,
    onContextWindow,
    ghToken,
    onGhToken,
    ghUser,
    onConnectGithub,
    repoSearch,
    onRepoSearch,
    onSearchRepos,
    repos,
    selectedRepo,
    onSelectRepo,
    pasteUrl,
    onPasteUrl,
    onApplyPastedRepo,
    contentMcp,
    githubMcp,
  } = props;

  const filteredModels = models.filter((m) => m.id.toLowerCase().includes(modelQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex items-center gap-2">
          <Server className="size-4 text-accent" />
          <h3 className="font-display text-[15px] font-semibold">AI provider</h3>
        </header>
        <p className="text-[12px] leading-relaxed text-foreground-subtle">
          OpenAI-compatible endpoints, including local servers. Keys stay in this browser.
        </p>

        {providers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProvider(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  p.id === activeProviderId
                    ? "border-accent bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-foreground"
                    : "border-border bg-background text-foreground-muted hover:text-foreground"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Provider name</span>
            <input value={draft.name} onChange={(e) => onDraft({ ...draft, name: e.target.value })} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Endpoint / base URL</span>
            <input
              value={draft.baseUrl}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => onDraft({ ...draft, baseUrl: e.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>API key (local keys allowed)</span>
          <input
            type="password"
            value={draft.apiKey}
            placeholder="sk-… or local-key"
            onChange={(e) => onDraft({ ...draft, apiKey: e.target.value })}
            className={fieldClass}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={onSaveProvider}>
            <KeyRound className="size-3.5" />
            Save provider
          </Button>
          <Button size="sm" variant="secondary" onClick={onLoadModels}>
            <PlugZap className="size-3.5" />
            Fetch models
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className={labelClass}>Search models</span>
            <input value={modelQuery} onChange={(e) => onModelQuery(e.target.value)} placeholder="Filter…" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className={labelClass}>Model</span>
            <select value={modelId} onChange={(e) => onSelectModel(e.target.value)} className={fieldClass}>
              {filteredModels.length === 0 && <option value="">No models loaded</option>}
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Max output tokens</span>
            <input type="number" value={maxTokens} onChange={(e) => onMaxTokens(Number(e.target.value))} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Max context window</span>
            <input
              type="number"
              value={contextWindow}
              onChange={(e) => onContextWindow(Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-7">
        <header className="flex items-center gap-2">
          <GitBranch className="size-4 text-accent" />
          <h3 className="font-display text-[15px] font-semibold">GitHub</h3>
          {ghUser && <span className="pill pill-neutral">@{ghUser}</span>}
        </header>
        <p className="text-[12px] leading-relaxed text-foreground-subtle">
          Authenticate with a classic or fine-grained PAT. GitHub MCP:{" "}
          <a href={githubMcp} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            {githubMcp}
          </a>
        </p>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Personal access token</span>
          <input type="password" value={ghToken} onChange={(e) => onGhToken(e.target.value)} className={fieldClass} />
        </label>
        <Button size="sm" variant="primary" onClick={onConnectGithub}>
          <GitBranch className="size-3.5" />
          Fetch my repositories
        </Button>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Search public repositories</span>
            <div className="flex gap-2">
              <input
                value={repoSearch}
                onChange={(e) => onRepoSearch(e.target.value)}
                placeholder="next.js app"
                className={fieldClass}
              />
              <Button size="icon-sm" variant="secondary" onClick={onSearchRepos} aria-label="Search GitHub">
                <Search className="size-4" />
              </Button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Or paste a repository URL</span>
            <div className="flex gap-2">
              <input value={pasteUrl} onChange={(e) => onPasteUrl(e.target.value)} placeholder="owner/name" className={fieldClass} />
              <Button size="sm" variant="secondary" onClick={onApplyPastedRepo}>
                Use
              </Button>
            </div>
          </label>
        </div>

        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-2">
          {repos.length === 0 && (
            <p className="px-2 py-6 text-center text-[12px] text-foreground-subtle">
              No repositories loaded yet.
            </p>
          )}
          {repos.map((r) => (
            <button
              key={r.fullName}
              type="button"
              onClick={() => onSelectRepo(r)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                selectedRepo?.fullName === r.fullName
                  ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-foreground"
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <span className="truncate">{r.fullName}</span>
              {r.private && <span className="pill pill-neutral ml-auto">private</span>}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-foreground-subtle">
          Content Checklist MCP:{" "}
          <a href={contentMcp} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            {contentMcp}
          </a>
        </p>
      </section>
    </div>
  );
}
