"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadJson, saveJson } from "../lib/storage";
import {
  applyTheme,
  defaultThemeForMode,
  isStoredTheme,
  PRESET_THEMES,
  type Theme,
  type ThemeMode,
} from "../lib/theme";

const KEY_ACTIVE = "fec-theme";
const KEY_DARK = "fec-theme-dark";
const KEY_LIGHT = "fec-theme-light";
const KEY_CUSTOM = "fec-custom-themes";

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  presets: Theme[];
  customThemes: Theme[];
  allThemes: Theme[];
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  saveCustomTheme: (theme: Theme) => void;
  deleteCustomTheme: (id: string) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => defaultThemeForMode("dark"));
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const storedCustom = loadJson<Theme[]>(KEY_CUSTOM, []);
    setCustomThemes(Array.isArray(storedCustom) ? storedCustom.filter(isStoredTheme) : []);

    const storedActive = loadJson<Theme | null>(KEY_ACTIVE, null);
    const next = storedActive && isStoredTheme(storedActive) ? storedActive : defaultThemeForMode("dark");
    setThemeState(next);
    applyTheme(next);

    hydratedRef.current = true;
  }, []);

  const persistActiveTheme = useCallback((next: Theme) => {
    if (!hydratedRef.current) return;
    saveJson(KEY_ACTIVE, next);
    saveJson(next.mode === "dark" ? KEY_DARK : KEY_LIGHT, next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
      persistActiveTheme(next);
    },
    [persistActiveTheme]
  );

  const setMode = useCallback(
    (mode: ThemeMode) => {
      if (mode === theme.mode) return;
      const stored = loadJson<Theme | null>(mode === "dark" ? KEY_DARK : KEY_LIGHT, null);
      const fallback = defaultThemeForMode(mode);
      const candidate =
        stored && stored.mode === mode ? stored : PRESET_THEMES.find((t) => t.mode === mode) ?? fallback;
      setTheme(candidate);
    },
    [theme.mode, setTheme]
  );

  const toggleMode = useCallback(() => {
    setMode(theme.mode === "dark" ? "light" : "dark");
  }, [theme.mode, setMode]);

  const saveCustomTheme = useCallback(
    (next: Theme) => {
      setCustomThemes((prev) => {
        const i = prev.findIndex((t) => t.id === next.id);
        const updated = i >= 0 ? prev.map((t) => (t.id === next.id ? next : t)) : [...prev, next];
        if (hydratedRef.current) saveJson(KEY_CUSTOM, updated);
        return updated;
      });
      setTheme(next);
    },
    [setTheme]
  );

  const deleteCustomTheme = useCallback(
    (id: string) => {
      setCustomThemes((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        if (hydratedRef.current) saveJson(KEY_CUSTOM, updated);
        return updated;
      });
      if (theme.id === id) {
        const fallback = defaultThemeForMode(theme.mode);
        setThemeState(fallback);
        applyTheme(fallback);
        persistActiveTheme(fallback);
      }
    },
    [theme.id, theme.mode, persistActiveTheme]
  );

  const resetTheme = useCallback(() => {
    const next = defaultThemeForMode("dark");
    setTheme(next);
  }, [setTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const allThemes = [...PRESET_THEMES, ...customThemes];
    return {
      theme,
      mode: theme.mode,
      presets: PRESET_THEMES,
      customThemes,
      allThemes,
      setTheme,
      setMode,
      toggleMode,
      saveCustomTheme,
      deleteCustomTheme,
      resetTheme,
    };
  }, [theme, customThemes, setTheme, setMode, toggleMode, saveCustomTheme, deleteCustomTheme, resetTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
