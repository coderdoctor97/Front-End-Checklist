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
import { Markdown } from "../components/Markdown";

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
  const [setupOpen, setSetupOpen] = useState(false);
  const [draft, setDraft] = useState<AiProvider>({
    id: "",
    name: "OpenAI-compatible",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
  });

  useEffect(() => {
    setChecked(loadJson("fec-checked", {}));
    const savedP = loadJson<AiProvider[]>("fec-providers", []);
    setProviders(savedP);
    const ap = loadJson("fec-active-provider", "");
    setActiveProviderId(ap);
    setGhToken(loadJson("fec-gh-token", ""));
    setSelectedRepo(loadJson("fec-repo", null));
    setMessages(loadJson("fec-chat", []));
  }, []);

  useEffect(() => saveJson("fec-checked", checked), [checked]);
  useEffect(() => saveJson("fec-providers", providers), [providers]);
  useEffect(() => saveJson("fec-active-provider", activeProviderId), [activeProviderId]);
  useEffect(() => saveJson("fec-gh-token", ghToken), [ghToken]);
  useEffect(() => saveJson("fec-repo", selectedRepo), [selectedRepo]);
  useEffect(() => saveJson("fec-chat", messages), [messages]);

  const cat = categories.find((c) => c.id === catId) || categories[0];
  const provider = providers.find((p) => p.id === activeProviderId);
  const aiReady = Boolean(provider?.baseUrl && provider?.apiKey && modelId);
  const done = Object.values(checked).filter(Boolean).length;
  const total = categories.reduce((n, c) => n + c.items.length, 0);

  const filteredModels = models.filter((m) =>
    m.id.toLowerCase().includes(modelQuery.toLowerCase())
  );

  async function loadModels(p = provider) {
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
  }

  async function generatePrompt(item: ChecklistItem, mod: PromptModifier = modifier) {
    if (!provider) return;
    setBusy(true);
    setError("");
    try {
      const skills = selectedRepo
        ? await searchCodeSkills(selectedRepo, item.title.split(" ").slice(0, 4).join(" "), ghToken || undefined)
        : [];
      const sys = `You craft implementation prompts for external coding agents (Cursor, Claude Code, Codex). Output markdown. Do not wrap the whole answer in a single giant code fence.`;
      const user = [
        `Checklist item: ${item.title}`,
        `Priority: ${item.priority}`,
        `Description: ${item.description}`,
        `Rule page: ${item.url}`,
        selectedRepo ? `Target repository: ${selectedRepo.fullName} (${selectedRepo.url})` : "No repository selected yet.",
        `Content Checklist MCP server: ${CONTENT_MCP}`,
        `GitHub MCP server: ${GITHUB_MCP}`,
        skills.length ? `Relevant files/skills found in the repo:\n${skills.join("\n")}` : "No GitHub code search hits (token may lack code-search scope, or repo is empty).",
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
    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
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
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  const catDone = useMemo(
    () => cat.items.filter((i) => checked[`${cat.id}:${i.id}`]).length,
    [cat, checked]
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="brand">Front-End Checklist</p>
        <p className="sub">Interactive review for humans and coding agents</p>
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn small" onClick={() => setSetupOpen(true)}>
            AI & GitHub setup
          </button>
        </div>
        {categories.map((c) => {
          const n = c.items.filter((i) => checked[`${c.id}:${i.id}`]).length;
          return (
            <div
              key={c.id}
              className={`nav-item ${c.id === catId ? "active" : ""}`}
              onClick={() => setCatId(c.id)}
            >
              <div>
                <strong>{c.title}</strong>
                <div className="sub" style={{ margin: 0 }}>
                  {n}/{c.items.length}
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      <main className="main">
        <div className="toolbar">
          <div>
            <h1 className="h1">{cat.title}</h1>
            <p className="progress">
              {cat.description} · {catDone}/{cat.items.length} in this category · {done}/{total} overall
            </p>
          </div>
          <div className="row">
            <span className="badge">{selectedRepo ? selectedRepo.fullName : "No repo"}</span>
            <span className="badge">{aiReady ? modelId : "AI not configured"}</span>
          </div>
        </div>
        {error && (
          <div className="card" style={{ borderColor: "var(--crit)", color: "var(--crit)" }}>
            {error}
          </div>
        )}
        {cat.items.map((item) => {
          const key = `${cat.id}:${item.id}`;
          const on = Boolean(checked[key]);
          return (
            <article className="card" key={item.id}>
              <div className="item-head">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setChecked((s) => ({ ...s, [key]: e.target.checked }))}
                  aria-label={item.title}
                />
                <h3>{item.title}</h3>
                <span className={`badge ${item.priority}`}>{item.priority}</span>
                {on && aiReady && (
                  <button className="btn small" onClick={() => generatePrompt(item)} disabled={busy}>
                    Ask AI for the prompt
                  </button>
                )}
              </div>
              <p className="desc">
                {item.description}{" "}
                <a href={item.url} target="_blank" rel="noreferrer">
                  Rule
                </a>
              </p>
            </article>
          );
        })}
      </main>

      <aside className="chat-pane">
        <h2 style={{ marginTop: 0 }}>Assistant</h2>
        <p className="sub">
          Chat with your provider. Prompts are meant to be copied into Cursor, Claude Code, or similar.
        </p>
        {!selectedRepo && (
          <div className="card">
            <strong>Select a repository before chatting</strong>
            <div className="field" style={{ marginTop: 8 }}>
              <label>Paste GitHub URL or owner/name</label>
              <input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://github.com/org/repo" />
            </div>
            <button className="btn small" onClick={applyPastedRepo}>
              Use this repo
            </button>
          </div>
        )}
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
            </div>
          ))}
        </div>
        <div className="field">
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={aiReady ? "Ask how to implement a rule…" : "Configure AI first"}
            disabled={!aiReady || !selectedRepo}
          />
        </div>
        <div className="row">
          <button className="btn" onClick={sendChat} disabled={!aiReady || !selectedRepo || busy}>
            Send
          </button>
          <button className="btn ghost" onClick={() => setMessages([])}>
            Clear
          </button>
        </div>
      </aside>

      {setupOpen && (
        <div className="modal-bg" onClick={() => setSetupOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>AI provider</h2>
            <p className="sub">OpenAI-compatible, including local servers. Keys stay in this browser.</p>
            <div className="field">
              <label>Provider name</label>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Endpoint / base URL</label>
              <input
                value={draft.baseUrl}
                placeholder="http://127.0.0.1:1234/v1 or https://api.openai.com/v1"
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              />
            </div>
            <div className="field">
              <label>API key (local keys allowed)</label>
              <input
                type="password"
                value={draft.apiKey}
                placeholder="sk-... or local-key"
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              />
            </div>
            <div className="row">
              <button className="btn" onClick={saveProvider}>
                Save provider
              </button>
              <button className="btn ghost" onClick={() => loadModels({ ...draft, id: draft.id || "tmp" })}>
                Fetch models
              </button>
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Search models</label>
              <input className="search" value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} />
              <select
                value={modelId}
                onChange={(e) => {
                  const id = e.target.value;
                  setModelId(id);
                  const m = models.find((x) => x.id === id);
                  const lim = defaultLimits(m);
                  setMaxTokens(lim.maxTokens);
                  setContextWindow(lim.contextWindow);
                }}
              >
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <div className="field">
                <label>Max output tokens (highest available by default)</label>
                <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Max context window</label>
                <input type="number" value={contextWindow} onChange={(e) => setContextWindow(Number(e.target.value))} />
              </div>
            </div>

            <h2>GitHub</h2>
            <p className="sub">
              Authenticate with a classic or fine-grained PAT. OAuth device/app tokens also work if pasted as a bearer token.
              GitHub MCP: {GITHUB_MCP}
            </p>
            <div className="field">
              <label>Personal access token or OAuth access token</label>
              <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} />
            </div>
            <div className="row">
              <button className="btn" onClick={connectGithub}>
                Fetch my repositories
              </button>
              {ghUser && <span className="badge">@{ghUser}</span>}
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Search public repositories</label>
              <input value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="next.js app" />
            </div>
            <button className="btn ghost" onClick={searchRepos}>
              Search GitHub
            </button>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Or paste a repository URL</label>
              <input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} />
              <button className="btn small" onClick={applyPastedRepo} style={{ marginTop: 6 }}>
                Select pasted repo
              </button>
            </div>
            <div style={{ maxHeight: 180, overflow: "auto", marginTop: 8 }}>
              {repos.map((r) => (
                <div
                  key={r.fullName}
                  className="nav-item"
                  onClick={() => setSelectedRepo(r)}
                >
                  {r.fullName} {r.private ? "(private)" : ""}
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setSetupOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {promptItem && (
        <div className="modal-bg" onClick={() => setPromptItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Implementation prompt</h2>
            <p className="sub">{promptItem.title}</p>
            <div className="row" style={{ marginBottom: 10 }}>
              {(["default", "think-deeper", "think-longer", "shorter"] as PromptModifier[]).map((m) => (
                <button
                  key={m}
                  className={`btn small ${modifier === m ? "" : "ghost"}`}
                  onClick={() => {
                    setModifier(m);
                    generatePrompt(promptItem, m);
                  }}
                >
                  {m === "default" ? "Balanced" : m.replace("-", " ")}
                </button>
              ))}
            </div>
            <div className="card prompt-out">
              <Markdown>{generated || (busy ? "Generating…" : "")}</Markdown>
            </div>
            <div className="row">
              <button
                className="btn"
                onClick={() => navigator.clipboard.writeText(generated)}
                disabled={!generated}
              >
                Copy
              </button>
              <button className="btn ghost" onClick={() => generatePrompt(promptItem)} disabled={busy}>
                Regenerate
              </button>
              <button className="btn ghost" onClick={() => setPromptItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
