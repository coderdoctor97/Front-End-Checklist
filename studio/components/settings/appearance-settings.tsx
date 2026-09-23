"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Download,
  FileUp,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../theme-provider";
import { cn } from "../../lib/cn";
import {
  COLOR_KEYS,
  FONT_OPTIONS,
  isBuiltinThemeId,
  parseThemeJson,
  themeToJson,
  type Theme,
} from "../../lib/theme";

function Swatches({ theme }: { theme: Theme }) {
  const colors = [theme.colors.background, theme.colors.surface, theme.colors.accent, theme.colors.foreground];
  return (
    <div className="flex overflow-hidden rounded-md border border-border">
      {colors.map((c, i) => (
        <span key={i} className="size-4" style={{ background: c }} />
      ))}
    </div>
  );
}

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border"
      style={{ background: theme.colors.background, borderColor: theme.colors.borderStrong, color: theme.colors.foreground }}
    >
      <div className="border-b px-3.5 py-3" style={{ borderColor: theme.colors.border }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="truncate text-[13.5px] font-semibold"
              style={{ fontFamily: FONT_OPTIONS[theme.fonts.display].stack }}
            >
              {theme.name}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: theme.colors.foregroundMuted }}>
              {theme.id} · radius {theme.radius}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
            style={{ borderColor: theme.colors.borderStrong, color: theme.colors.foregroundMuted }}
          >
            {theme.mode}
          </span>
        </div>
        {theme.author && (
          <p className="mt-1 text-[11px]" style={{ color: theme.colors.foregroundSubtle }}>
            by {theme.author}
          </p>
        )}
        <p className="mt-1 text-[11px]" style={{ color: theme.colors.foregroundSubtle }}>
          fonts: {FONT_OPTIONS[theme.fonts.display].label} / {FONT_OPTIONS[theme.fonts.body].label} /{" "}
          {FONT_OPTIONS[theme.fonts.mono].label}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 py-3">
        {COLOR_KEYS.map((k) => (
          <span
            key={k}
            title={`${k}: ${theme.colors[k]}`}
            className="size-5 rounded-md border"
            style={{ background: theme.colors[k], borderColor: theme.colors.border }}
          />
        ))}
      </div>
    </div>
  );
}

type CustomThemeCardProps = {
  theme: Theme;
  active: boolean;
  confirming: boolean;
  onApply: () => void;
  onEdit: () => void;
  onExport: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

function CustomThemeCard({
  theme: t,
  active,
  confirming,
  onApply,
  onEdit,
  onExport,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: CustomThemeCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        active ? "border-accent" : "border-border bg-background"
      )}
    >
      <button type="button" onClick={onApply} className="flex w-full items-center gap-3 text-left">
        <Swatches theme={t} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{t.name}</span>
          <span className="block text-[11px] text-foreground-subtle capitalize">{t.mode}</span>
        </span>
        {active && <Check className="size-4 shrink-0 text-accent" />}
      </button>

      {confirming ? (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <p className="min-w-0 truncate text-[11.5px] text-foreground-muted">Delete “{t.name}”?</p>
          <span className="flex shrink-0 items-center gap-1.5">
            <Button size="sm" variant="danger" onClick={onConfirmDelete}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
          </span>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-1 border-t border-border pt-2.5">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onApply}
            disabled={active}
            title={active ? "Already active" : "Apply theme"}
            aria-label={`Apply ${t.name}`}
          >
            <Check className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} title="Edit JSON" aria-label={`Edit ${t.name}`}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onExport} title="Export JSON" aria-label={`Export ${t.name}`}>
            <Download className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRequestDelete}
            title="Delete"
            aria-label={`Delete ${t.name}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function AppearanceSettings() {
  const { theme, mode, setMode, presets, customThemes, setTheme, saveCustomTheme, deleteCustomTheme } = useTheme();
  const [json, setJson] = useState(() => themeToJson(theme));
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<Theme | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Keep the editor in sync with the active theme only while it is pristine
  // (no user draft, not mid-edit). This protects typed/imported JSON and the
  // edit workflow from being clobbered by unrelated theme changes.
  useEffect(() => {
    if (editingId || dirty) return;
    setJson(themeToJson(theme));
    setErrors([]);
    setPreview(null);
  }, [theme, editingId, dirty]);

  const editingName = editingId ? customThemes.find((t) => t.id === editingId)?.name : undefined;

  function focusEditor() {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    editorRef.current?.focus();
  }

  function resetEditor(value: string) {
    setJson(value);
    setDirty(false);
    setErrors([]);
    setPreview(null);
    setNotice("");
  }

  function validateEditor(): Theme | null {
    setNotice("");
    const result = parseThemeJson(json);
    if (!result.ok) {
      setErrors(result.errors);
      setPreview(null);
      return null;
    }
    const candidate = result.theme;
    if (isBuiltinThemeId(candidate.id)) {
      setErrors([`The id "${candidate.id}" is reserved by a built-in preset. Choose another id.`]);
      setPreview(null);
      return null;
    }
    if (editingId) {
      if (candidate.id !== editingId) {
        setErrors([`Cannot change the id while editing. Keep "${editingId}" or recreate the theme.`]);
        setPreview(null);
        return null;
      }
    } else if (customThemes.some((t) => t.id === candidate.id)) {
      setErrors([`A custom theme with the id "${candidate.id}" already exists. Choose a unique id.`]);
      setPreview(null);
      return null;
    }
    setErrors([]);
    setPreview(candidate);
    setNotice(editingId ? "Valid — ready to save changes." : "Valid — ready to create.");
    return candidate;
  }

  function submitTheme() {
    const candidate = validateEditor();
    if (!candidate) return;
    const isEdit = editingId !== null;
    saveCustomTheme(candidate);
    setEditingId(null);
    setPreview(null);
    setDirty(false);
    setNotice(isEdit ? `Updated “${candidate.name}”.` : `Created “${candidate.name}”.`);
  }

  function startCreate() {
    setEditingId(null);
    resetEditor(themeToJson(theme));
    setDirty(true);
    focusEditor();
  }

  function startEdit(t: Theme) {
    setJson(themeToJson(t));
    setDirty(true);
    setEditingId(t.id);
    setPreview(t);
    setErrors([]);
    setNotice("");
    focusEditor();
  }

  function cancelEdit() {
    setEditingId(null);
    resetEditor(themeToJson(theme));
  }

  function loadCurrent() {
    setEditingId(null);
    resetEditor(themeToJson(theme));
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setNotice("Theme JSON copied to clipboard.");
    } catch {
      setNotice("Could not copy to clipboard.");
    }
  }

  function downloadTheme(t: Theme) {
    const blob = new Blob([themeToJson(t)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadEditor() {
    downloadTheme(preview ?? theme);
  }

  function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrors(["Please choose a .json file."]);
      setNotice("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseThemeJson(text);
      if (!result.ok) {
        setErrors(result.errors);
        setPreview(null);
        setNotice("");
        return;
      }
      const candidate = result.theme;
      if (isBuiltinThemeId(candidate.id)) {
        setErrors([`The id "${candidate.id}" is reserved by a built-in preset. Choose another id.`]);
        setPreview(null);
        return;
      }
      if (customThemes.some((t) => t.id === candidate.id)) {
        setErrors([`A custom theme with the id "${candidate.id}" already exists. Choose a unique id.`]);
        setPreview(null);
        return;
      }
      setEditingId(null);
      setJson(themeToJson(candidate));
      setDirty(true);
      setPreview(candidate);
      setErrors([]);
      setNotice(`Imported “${candidate.name}” — review it, then create.`);
      focusEditor();
    };
    reader.onerror = () => {
      setErrors(["Could not read the file."]);
      setNotice("");
    };
    reader.readAsText(file);
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  function confirmDelete(t: Theme) {
    deleteCustomTheme(t.id);
    setConfirmDeleteId(null);
    if (editingId === t.id) {
      setEditingId(null);
      setDirty(false);
      setPreview(null);
      setErrors([]);
    }
    setNotice(`Deleted “${t.name}”.`);
  }

  return (
    <div className="space-y-7">
      {/* Mode */}
      <section>
        <h3 className="mb-2.5 text-[12px] font-semibold tracking-wide text-foreground-muted uppercase">Mode</h3>
        <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-4 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                mode === m ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Presets */}
      <section>
        <h3 className="mb-2.5 text-[12px] font-semibold tracking-wide text-foreground-muted uppercase">Presets</h3>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => {
            const active = p.id === theme.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTheme(p)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
                    : "border-border bg-background hover:border-border-strong"
                )}
              >
                <Swatches theme={p} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{p.name}</span>
                  <span className="block text-[11px] text-foreground-subtle capitalize">{p.mode}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom themes */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[12px] font-semibold tracking-wide text-foreground-muted uppercase">Custom themes</h3>
          <span className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={startCreate}>
              <Plus className="size-3.5" />
              Create
            </Button>
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="size-3.5" />
              Import .json
            </Button>
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label="Import theme JSON file"
          onChange={onImportFile}
        />

        {customThemes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-[12.5px] text-foreground-subtle">
            No custom themes yet. Create one from JSON or import a .json file.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {customThemes.map((t) => (
              <CustomThemeCard
                key={t.id}
                theme={t}
                active={t.id === theme.id}
                confirming={confirmDeleteId === t.id}
                onApply={() => setTheme(t)}
                onEdit={() => startEdit(t)}
                onExport={() => downloadTheme(t)}
                onRequestDelete={() => requestDelete(t.id)}
                onCancelDelete={cancelDelete}
                onConfirmDelete={() => confirmDelete(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* JSON editor */}
      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h3 className="text-[12px] font-semibold tracking-wide text-foreground-muted uppercase">
            Custom theme JSON
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] text-foreground-subtle">
            <Sparkles className="size-3" />
            schema: data/theme.schema.json
          </span>
        </div>

        {editingId && (
          <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-3 py-2">
            <Pencil className="size-3.5 shrink-0 text-accent" />
            <p className="min-w-0 flex-1 truncate text-[12px]">
              Editing “{editingName ?? editingId}” — saving updates the existing theme.
            </p>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        )}

        <textarea
          ref={editorRef}
          spellCheck={false}
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setDirty(true);
          }}
          rows={16}
          className="scrollbar-none w-full resize-y rounded-xl border border-border bg-background p-3.5 font-mono text-[12px] leading-relaxed outline-none transition-colors focus:border-accent"
        />

        {errors.length > 0 && (
          <div className="mt-2.5 rounded-lg border border-[color-mix(in_oklab,var(--critical)_45%,transparent)] bg-[color-mix(in_oklab,var(--critical)_10%,transparent)] p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-critical">
              <TriangleAlert className="size-3.5" />
              Fix these before creating
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[12px] text-critical">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {preview && <ThemePreview theme={preview} />}

        {notice && errors.length === 0 && <p className="mt-2.5 text-[12px] text-low">{notice}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => validateEditor()}>
            <BadgeCheck className="size-3.5" />
            Validate
          </Button>
          <Button size="sm" variant="primary" onClick={submitTheme}>
            <Check className="size-3.5" />
            {editingId ? "Save changes" : "Create theme"}
          </Button>
          <Button size="sm" variant="ghost" onClick={loadCurrent}>
            <RotateCcw className="size-3.5" />
            Load current
          </Button>
          <Button size="sm" variant="ghost" onClick={copyJson}>
            <Copy className="size-3.5" />
            Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadEditor}>
            <Download className="size-3.5" />
            Download
          </Button>
        </div>
      </section>
    </div>
  );
}