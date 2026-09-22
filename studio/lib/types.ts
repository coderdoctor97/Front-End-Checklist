export type Priority = "critical" | "high" | "medium" | "low";

export type ChecklistItem = {
  id: string;
  title: string;
  url: string;
  priority: Priority;
  description: string;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
};

export type AiProvider = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RepoRef = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  private?: boolean;
};

export type PromptModifier =
  | "default"
  | "think-deeper"
  | "think-longer"
  | "shorter";
