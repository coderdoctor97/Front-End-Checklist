import type { RepoRef } from "./types";

const API = "https://api.github.com";

export function parseRepoUrl(input: string): RepoRef | null {
  const trimmed = input.trim();
  const m =
    trimmed.match(/github\.com\/([^/]+)\/([^/#?]+)/i) ||
    trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!m) return null;
  const owner = m[1];
  const name = m[2].replace(/\.git$/, "");
  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
  };
}

async function gh(path: string, token?: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init?.headers as object) } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `GitHub ${res.status}`);
  }
  return res.json();
}

export async function listUserRepos(token: string): Promise<RepoRef[]> {
  const data = await gh("/user/repos?per_page=100&sort=updated", token);
  return (data as Array<Record<string, unknown>>).map((r) => ({
    owner: String((r.owner as { login: string }).login),
    name: String(r.name),
    fullName: String(r.full_name),
    url: String(r.html_url),
    private: Boolean(r.private),
  }));
}

export async function searchPublicRepos(query: string, token?: string): Promise<RepoRef[]> {
  const q = encodeURIComponent(query);
  const data = await gh(`/search/repositories?q=${q}&per_page=20`, token);
  return (data.items as Array<Record<string, unknown>>).map((r) => ({
    owner: String((r.owner as { login: string }).login),
    name: String(r.name),
    fullName: String(r.full_name),
    url: String(r.html_url),
    private: Boolean(r.private),
  }));
}

export async function searchCodeSkills(
  repo: RepoRef,
  query: string,
  token?: string
): Promise<string[]> {
  const q = encodeURIComponent(`${query} repo:${repo.fullName}`);
  try {
    const data = await gh(`/search/code?q=${q}`, token);
    const items = (data.items as Array<{ path: string; html_url: string }>) || [];
    return items.slice(0, 8).map((i) => `${i.path} (${i.html_url})`);
  } catch {
    return [];
  }
}

export async function getAuthedUser(token: string) {
  const data = await gh("/user", token);
  return { login: data.login as string, name: (data.name as string) || data.login };
}
