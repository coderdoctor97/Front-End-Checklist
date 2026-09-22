import type { ChatMessage } from "./types";

export type ModelInfo = {
  id: string;
  maxOutput?: number;
  contextWindow?: number;
};

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  if (b.endsWith("/v1") && path.startsWith("/v1/")) {
    return b + path.slice(3);
  }
  return b + path;
}

export async function fetchModels(
  baseUrl: string,
  apiKey: string
): Promise<ModelInfo[]> {
  const res = await fetch(joinUrl(baseUrl, "/v1/models"), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Models request failed (${res.status})`);
  }
  const data = await res.json();
  const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
  return list.map((m: Record<string, unknown>) => {
    const id = String(m.id ?? m.name ?? "");
    const limits = (m.limits as Record<string, number> | undefined) || {};
    const maxOutput =
      Number(
        m.max_output_tokens ??
          m.max_completion_tokens ??
          limits.max_output_tokens ??
          m.max_tokens ??
          0
      ) || undefined;
    const contextWindow =
      Number(
        m.context_window ??
          m.context_length ??
          limits.context_window ??
          m.max_context_tokens ??
          0
      ) || undefined;
    return { id, maxOutput, contextWindow };
  }).filter((m: ModelInfo) => m.id);
}

export function defaultLimits(model: ModelInfo | undefined) {
  return {
    maxTokens: model?.maxOutput || 16384,
    contextWindow: model?.contextWindow || 128000,
  };
}

export async function chatCompletions(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
}): Promise<string> {
  const res = await fetch(joinUrl(opts.baseUrl, "/v1/chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.4,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Chat request failed (${res.status})`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return String(content);
}
