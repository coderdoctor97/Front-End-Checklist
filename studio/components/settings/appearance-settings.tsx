"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, RotateCcw, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../theme-provider";
import { cn } from "../../lib/cn";
import { themeToJson, validateTheme, type Theme } from "../../lib/theme";

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

export function AppearanceSettings() {
  const { theme, mode, setMode, presets, customThemes, setTheme, saveCustomTheme, deleteCustomTheme } = useTheme();
  const [json, setJson] = useState(() => themeToJson(theme));
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setJson(themeToJson(theme));
    setErrors([]);
  }, [theme]);

  function applyJson() {
    setNotice("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Invalid JSON."]);
      return;
    }
    const result = validateTheme(parsed);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (presets.some((p) => p.id === result.theme.id)) {
      setErrors([`The id "${result.theme.id}" is reserved by a built-in preset. Choose another id.`]);
      return;
    }
    setErrors([]);
    saveCustomTheme(result.theme);
    setNotice(`Applied “${result.theme.name}”.`);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setNotice("Theme JSON copied to clipboard.");
    } catch {
      setNotice("Could not copy to clipboard.");
    }
  }

  function downloadJson() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.id || "theme"}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      {customThemes.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[12px] font-semibold tracking-wide text-foreground-muted uppercase">Your themes</h3>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {customThemes.map((t) => {
              const active = t.id === theme.id;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    active ? "border-accent" : "border-border bg-background"
                  )}
                >
                  <button type="button" onClick={() => setTheme(t)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Swatches theme={t} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{t.name}</span>
                      <span className="block text-[11px] text-foreground-subtle capitalize">{t.mode}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCustomTheme(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface-hover hover:text-critical"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

        <textarea
          spellCheck={false}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={16}
          className="scrollbar-none w-full resize-y rounded-xl border border-border bg-background p-3.5 font-mono text-[12px] leading-relaxed outline-none transition-colors focus:border-accent"
        />

        {errors.length > 0 && (
          <div className="mt-2.5 rounded-lg border border-[color-mix(in_oklab,var(--critical)_45%,transparent)] bg-[color-mix(in_oklab,var(--critical)_10%,transparent)] p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-critical">
              <TriangleAlert className="size-3.5" />
              Fix these before applying
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[12px] text-critical">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {notice && errors.length === 0 && (
          <p className="mt-2.5 text-[12px] text-low">{notice}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={applyJson}>
            <Check className="size-3.5" />
            Apply theme
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setJson(themeToJson(theme))}>
            <RotateCcw className="size-3.5" />
            Load current
          </Button>
          <Button size="sm" variant="ghost" onClick={copyJson}>
            <Copy className="size-3.5" />
            Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadJson}>
            <Download className="size-3.5" />
            Download
          </Button>
        </div>
      </section>
    </div>
  );
}
