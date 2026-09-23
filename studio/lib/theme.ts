import themesData from "../data/themes.json";

export type ThemeMode = "dark" | "light";

export type FontKey = "bricolage" | "instrument" | "jetbrains" | "system" | "georgia";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceHover: string;
  elevated: string;
  foreground: string;
  foregroundMuted: string;
  foregroundSubtle: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  success: string;
  warning: string;
  ring: string;
};

export type ThemeFonts = {
  display: FontKey;
  body: FontKey;
  mono: FontKey;
};

export type Theme = {
  id: string;
  name: string;
  mode: ThemeMode;
  author?: string;
  radius?: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
};

export const COLOR_KEYS = [
  "background",
  "surface",
  "surfaceHover",
  "elevated",
  "foreground",
  "foregroundMuted",
  "foregroundSubtle",
  "border",
  "borderStrong",
  "accent",
  "accentHover",
  "accentForeground",
  "critical",
  "high",
  "medium",
  "low",
  "success",
  "warning",
  "ring",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_VAR: Record<ColorKey, string> = {
  background: "--bg",
  surface: "--surface",
  surfaceHover: "--surface-hover",
  elevated: "--elevated",
  foreground: "--fg",
  foregroundMuted: "--fg-muted",
  foregroundSubtle: "--fg-subtle",
  border: "--border",
  borderStrong: "--border-strong",
  accent: "--accent",
  accentHover: "--accent-hover",
  accentForeground: "--accent-fg",
  critical: "--critical",
  high: "--high",
  medium: "--medium",
  low: "--low",
  success: "--success",
  warning: "--warning",
  ring: "--ring",
};

export const FONT_KEYS: FontKey[] = ["bricolage", "instrument", "jetbrains", "system", "georgia"];

export const FONT_OPTIONS: Record<FontKey, { label: string; stack: string; kind: "display" | "body" | "mono" }> = {
  bricolage: {
    label: "Bricolage Grotesque",
    stack: "var(--font-bricolage), ui-sans-serif, system-ui, sans-serif",
    kind: "display",
  },
  instrument: {
    label: "Instrument Sans",
    stack: "var(--font-instrument), ui-sans-serif, system-ui, sans-serif",
    kind: "body",
  },
  jetbrains: {
    label: "JetBrains Mono",
    stack: "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace",
    kind: "mono",
  },
  system: {
    label: "System Sans",
    stack: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    kind: "body",
  },
  georgia: {
    label: "Georgia Serif",
    stack: 'Georgia, "Times New Roman", serif',
    kind: "display",
  },
};

export const FONT_VAR = {
  display: "--font-display-family",
  body: "--font-body-family",
  mono: "--font-mono-family",
} as const;

export const PRESET_THEMES = themesData.themes as Theme[];

export const DEFAULT_DARK_ID = "ember-dark";
export const DEFAULT_LIGHT_ID = "ember-light";

export function getThemeById(id: string): Theme | undefined {
  return PRESET_THEMES.find((t) => t.id === id);
}

export function defaultThemeForMode(mode: ThemeMode): Theme {
  return getThemeById(mode === "dark" ? DEFAULT_DARK_ID : DEFAULT_LIGHT_ID) ?? PRESET_THEMES[0];
}

export function applyTheme(theme: Theme, el?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  const root = el ?? document.documentElement;
  for (const key of COLOR_KEYS) {
    const value = theme.colors[key];
    if (typeof value === "string" && value.length > 0) {
      root.style.setProperty(COLOR_VAR[key], value);
    }
  }
  root.style.setProperty(FONT_VAR.display, FONT_OPTIONS[theme.fonts.display]?.stack ?? FONT_OPTIONS.bricolage.stack);
  root.style.setProperty(FONT_VAR.body, FONT_OPTIONS[theme.fonts.body]?.stack ?? FONT_OPTIONS.instrument.stack);
  root.style.setProperty(FONT_VAR.mono, FONT_OPTIONS[theme.fonts.mono]?.stack ?? FONT_OPTIONS.jetbrains.stack);
  root.style.setProperty("--radius", theme.radius ?? "0.75rem");
  root.style.setProperty("--color-scheme", theme.mode);
  root.setAttribute("data-mode", theme.mode);
}

export type ThemeValidation =
  | { ok: true; theme: Theme }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTheme(input: unknown): ThemeValidation {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ["Theme must be a JSON object."] };
  }

  const id = input.id;
  const name = input.name;
  const mode = input.mode;

  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    errors.push('"id" must be a lowercase kebab-case string (e.g. "my-theme").');
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    errors.push('"name" must be a non-empty string.');
  }
  if (mode !== "dark" && mode !== "light") {
    errors.push('"mode" must be either "dark" or "light".');
  }

  const colorsRaw = input.colors;
  if (!isRecord(colorsRaw)) {
    errors.push('"colors" must be an object.');
  } else {
    for (const key of COLOR_KEYS) {
      const value = colorsRaw[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(`colors.${key} is missing or not a string.`);
      }
    }
  }

  const fontsRaw = input.fonts;
  if (!isRecord(fontsRaw)) {
    errors.push('"fonts" must be an object with "display", "body", and "mono".');
  } else {
    for (const slot of ["display", "body", "mono"] as const) {
      const value = fontsRaw[slot];
      if (typeof value !== "string" || !FONT_KEYS.includes(value as FontKey)) {
        errors.push(`fonts.${slot} must be one of: ${FONT_KEYS.join(", ")}.`);
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const colors = colorsRaw as Record<ColorKey, string>;
  const fonts = fontsRaw as Record<"display" | "body" | "mono", FontKey>;

  const theme: Theme = {
    id: id as string,
    name: (name as string).trim(),
    mode: mode as ThemeMode,
    author: typeof input.author === "string" ? input.author : undefined,
    radius: typeof input.radius === "string" && input.radius.trim() ? (input.radius as string) : "0.75rem",
    colors: COLOR_KEYS.reduce((acc, key) => {
      acc[key] = colors[key];
      return acc;
    }, {} as ThemeColors),
    fonts: { display: fonts.display, body: fonts.body, mono: fonts.mono },
  };

  return { ok: true, theme };
}

export function themeToJson(theme: Theme): string {
  return JSON.stringify(theme, null, 2);
}
