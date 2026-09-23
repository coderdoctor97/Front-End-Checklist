"use client";

import { useEffect, useMemo, useState } from "react";
import data from "../data/checklist.json";
import type {
  AiProvider,
  Category,
  ChatMessage,
  ChecklistItem,
  PromptModifier,
  RepoRef,
} from "../lib/types";
import { loadJson, saveJson } from "../lib/storage";
import {
  chatCompletions,
  defaultLimits,
  fetchModels,
  type ModelInfo,
} from "../lib/openai";
import {
  getAuthedUser,
  listUserRepos,
  parseRepoUrl,
  searchCodeSkills,
  searchPublicRepos,
} from "../lib/github";
import { EMPTY_PROFILE, type Profile } from "../lib/profile";
import { useMediaQuery } from "../lib/use-media-query";
import { Sidebar } from "../components/sidebar";
import { MainPanel } from "../components/main-panel";
import { ChatPane } from "../components/chat-pane";
import { SettingsModal, type SettingsTab } from "../components/settings-modal";
import { PromptModal } from "../components/prompt-modal";

const CONTENT_MCP = data.mcp.contentChecklist;
const GITHUB_MCP = data.mcp.github;
const categories = data.categories as Category[];

const modifierInstruction: Record<PromptModifier, string> = {
  default: "Write a complete, practical implementation prompt.",
  "think-deeper": "Think deeper: include architecture tradeoffs, edge cases, tests, and accessibility implications.",
  "think-longer": "Think longer: expand with detailed step-by-step file-level instructions and verification commands.",
  shorter: "Keep the prompt shorter and more concise while remaining actionable.",
};

export default function Page() {
  const [catId, setCatId] = useState(categories[0].id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelId, setModelId] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [maxTokens, setMaxTokens] = useState(16384);
  const [contextWindow, setContextWindow] = useState(128000);
  const [ghToken, setGhToken] = useState("");
  const [ghUser, setGhUser] = useState("");
  const [repos, setRepos] = useState<RepoRef[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<RepoRef | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [promptItem, setPromptItem] = useState<ChecklistItem | null>(null);
  const [generated, setGenerated] = useState("");
  const [modifier, setModifier] = useState<PromptModifier>("default");
  const [draft, setDraft] = useState<AiProvider>({
    id: "",
    name: "OpenAI-compatible",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
  });

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");

  const isDesktop = useMediaQuery("(min-width: 1024px)", true);

  useEffect(() => {
    setChecked(loadJson("fec-checked", {}));
    const savedP = loadJson<AiProvider[]>("fec-providers", []);
    setProviders(savedP);
    setActiveProviderId(loadJson("fec-active-provider", ""));
    setGhToken(loadJson("fec-gh-token", ""));
    setSelectedRepo(loadJson("fec-repo", null));
    setMessages(loadJson("fec-chat", []));
    setProfile(loadJson<Profile>("fec-profile", EMPTY_PROFILE));

    const storedSidebar = loadJson<boolean | null>("fec-sidebar-collapsed", null);
    if (typeof storedSidebar === "boolean") setSidebarCollapsed(storedSidebar);
    else setSidebarCollapsed(!window.matchMedia("(min-width: 1024px)").matches);

    setChatCollapsed(loadJson("fec-chat-collapsed", false));
  }, []);

  useEffect(() => saveJson("fec-checked", checked), [checked]);
  useEffect(() => saveJson("fec-providers", providers), [providers]);
  useEffect(() => saveJson("fec-active-provider", activeProviderId), [activeProviderId]);
  useEffect(() => saveJson("fec-gh-token", ghToken), [ghToken]);
  useEffect(() => saveJson("fec-repo", selectedRepo), [selectedRepo]);
  useEffect(() => saveJson("fec-chat", messages), [messages]);
  useEffect(() => saveJson("fec-profile", profile), [profile]);
  useEffect(() => saveJson("fec-sidebar-collapsed", sidebarCollapsed), [sidebarCollapsed]);
  useEffect(() => saveJson("fec-chat-collapsed", chatCollapsed), [chatCollapsed]);

  const cat = categories.find((c) => c.id === catId) || categories[0];
  const provider = providers.find((p) => p.id === activeProviderId);
  const aiReady = Boolean(provider?.baseUrl && provider?.apiKey && modelId);
  const done = Object.values(checked).filter(Boolean).length;
  const total = categories.reduce((n, c) => n + c.items.length, 0);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) {
      map[c.id] = c.items.filter((i) => checked[`${c.id}:${i.id}`]).length;
    }
    return map;
  }, [checked]);

  const catDone = counts[cat.id] ?? 0;

  async function loadModels(p: AiProvider | undefined = provider) {
    if (!p?.baseUrl || !p.apiKey) return;
    setError("");
    try {
      const list = await fetchModels(p.baseUrl, p.apiKey);
      setModels(list);
      const first = list[0];
      if (first) {
        setModelId(first.id);
        const lim = defaultLimits(first);
        setMaxTokens(lim.maxTokens);
        setContextWindow(lim.contextWindow);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch models");
    }
  }

  function saveProvider() {
    const id = draft.id || crypto.randomUUID();
    const next = { ...draft, id };
    setProviders((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
    setActiveProviderId(id);
    setDraft(next);
  }

  function selectProvider(id: string) {
    setActiveProviderId(id);
    const p = providers.find((x) => x.id === id);
    if (p) setDraft(p);
  }

  function selectModel(id: string) {
    setModelId(id);
    const m = models.find((x) => x.id === id);
    const lim = defaultLimits(m);
    setMaxTokens(lim.maxTokens);
    setContextWindow(lim.contextWindow);
  }

  async function connectGithub() {
    setError("");
    try {
      const u = await getAuthedUser(ghToken);
      setGhUser(u.login);
      const list = await listUserRepos(ghToken);
      setRepos(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GitHub auth failed");
    }
  }

  async function searchRepos() {
    setError("");
    try {
      const list = await searchPublicRepos(repoSearch, ghToken || undefined);
      setRepos(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    }
  }

  function applyPastedRepo() {
    const parsed = parseRepoUrl(pasteUrl);
    if (!parsed) {
      setError("Could not parse repository URL. Use owner/name or a GitHub URL.");
      return;
    }
    setSelectedRepo(parsed);
    setError("");
  }

  async function generatePrompt(item: ChecklistItem, mod: PromptModifier = modifier) {
    if (!provider) {
      setError("Configure an AI provider first.");
      setSettingsOpen(true);
      setSettingsTab("ai");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const skills = selectedRepo
        ? await searchCodeSkills(
            selectedRepo,
            item.title.split(" ").slice(0, 4).join(" "),
            ghToken || undefined
          )
        : [];
      const sys =
        "You craft implementation prompts for external coding agents (Cursor, Claude Code, Codex). Output markdown. Do not wrap the whole answer in a single giant code fence.";
      const user = [
        `Checklist item: ${item.title}`,
        `Priority: ${item.priority}`,
        `Description: ${item.description}`,
        `Rule page: ${item.url}`,
        selectedRepo
          ? `Target repository: ${selectedRepo.fullName} (${selectedRepo.url})`
          : "No repository selected yet.",
        `Content Checklist MCP server: ${CONTENT_MCP}`,
        `GitHub MCP server: ${GITHUB_MCP}`,
        skills.length
          ? `Relevant files/skills found in the repo:\n${skills.join("\n")}`
          : "No GitHub code search hits (token may lack code-search scope, or repo is empty).",
        modifierInstruction[mod],
        "The prompt MUST instruct the coding agent to:",
        "1. Connect to the Content Checklist MCP and fetch this rule plus related rules.",
        "2. Use the GitHub MCP to inspect and edit the selected repository.",
        "3. Search GitHub for relevant skills, examples, and existing implementations.",
        "4. Implement the requirement step by step with tests and verification.",
        "5. Leave a short summary of files changed.",
      ].join("\n");
      const text = await chatCompletions({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: modelId,
        maxTokens,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      });
      setGenerated(text);
      setPromptItem(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prompt generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendChat() {
    if (!provider || !input.trim()) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim(), at: Date.now() },
    ];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const sys: ChatMessage = {
        role: "system",
        content: `You are the Front-End Checklist assistant. Help implement checklist quality rules. Markdown only, render-friendly. MCP: ${CONTENT_MCP}. GitHub MCP: ${GITHUB_MCP}. Repo: ${selectedRepo?.fullName ?? "none"}. Context window about ${contextWindow} tokens.`,
      };
      const reply = await chatCompletions({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: modelId,
        maxTokens,
        messages: [sys, ...next],
      });
      setMessages([...next, { role: "assistant", content: reply, at: Date.now() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  function openSettings(tab: SettingsTab = "profile") {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  function selectCategory(id: string) {
    setCatId(id);
    if (!isDesktop) setSidebarCollapsed(true);
  }

  const chatNode = (
    <ChatPane
      collapsed={chatCollapsed}
      onToggleCollapsed={() => setChatCollapsed((v) => !v)}
      messages={messages}
      input={input}
      onInput={setInput}
      onSend={sendChat}
      onClear={() => setMessages([])}
      busy={busy}
      aiReady={aiReady}
      selectedRepo={selectedRepo}
      pasteUrl={pasteUrl}
      onPasteUrl={setPasteUrl}
      onApplyRepo={applyPastedRepo}
      profile={profile}
      modelLabel={aiReady ? modelId : "AI not configured"}
      onOpenSettings={openSettings}
      overlay={!isDesktop}
    />
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <Sidebar
        categories={categories}
        activeId={catId}
        onSelect={selectCategory}
        counts={counts}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        profile={profile}
        onOpenSettings={() => openSettings("profile")}
        search={search}
        onSearch={setSearch}
      />

      <MainPanel
        category={cat}
        categoryDone={catDone}
        totalDone={done}
        total={total}
        checked={checked}
        onToggleItem={(key) => setChecked((s) => ({ ...s, [key]: !s[key] }))}
        onExplain={(item) => window.open(item.url, "_blank", "noreferrer")}
        onGenerate={(item) => generatePrompt(item)}
        aiReady={aiReady}
        busy={busy}
        error={error}
        repoLabel={selectedRepo ? selectedRepo.fullName : "No repo"}
        modelLabel={aiReady ? modelId : "AI not configured"}
        chatCollapsed={chatCollapsed}
        onToggleChat={() => setChatCollapsed((v) => !v)}
        search={search}
        onClearSearch={() => setSearch("")}
      />

      {isDesktop || !chatCollapsed ? chatNode : null}

      <SettingsModal
        open={settingsOpen}
        tab={settingsTab}
        onTab={setSettingsTab}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onProfile={setProfile}
        error={error}
        ai={{
          draft,
          onDraft: setDraft,
          providers,
          activeProviderId,
          onSelectProvider: selectProvider,
          onSaveProvider: saveProvider,
          onLoadModels: () => loadModels({ ...draft, id: draft.id || "tmp" }),
          models,
          modelQuery,
          onModelQuery: setModelQuery,
          modelId,
          onSelectModel: selectModel,
          maxTokens,
          onMaxTokens: setMaxTokens,
          contextWindow,
          onContextWindow: setContextWindow,
          ghToken,
          onGhToken: setGhToken,
          ghUser,
          onConnectGithub: connectGithub,
          repoSearch,
          onRepoSearch: setRepoSearch,
          onSearchRepos: searchRepos,
          repos,
          selectedRepo,
          onSelectRepo: setSelectedRepo,
          pasteUrl,
          onPasteUrl: setPasteUrl,
          onApplyPastedRepo: applyPastedRepo,
          contentMcp: CONTENT_MCP,
          githubMcp: GITHUB_MCP,
        }}
      />

      <PromptModal
        item={promptItem}
        generated={generated}
        busy={busy}
        modifier={modifier}
        onModifier={setModifier}
        onRegenerate={() => promptItem && generatePrompt(promptItem)}
        onCopy={() => navigator.clipboard.writeText(generated)}
        onClose={() => setPromptItem(null)}
      />
    </div>
  );
}
