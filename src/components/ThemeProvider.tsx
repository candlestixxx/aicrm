'use client';

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  CUSTOM_COLOR_STORAGE_KEY,
  CUSTOM_PALETTE,
  DEFAULT_PALETTE,
  MODE_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme';
import {
  DEFAULT_CUSTOM_COLOR,
  generateDarkScale,
  generateScale,
  type CustomColor,
} from '@/lib/color';

interface ThemeSnapshot {
  mode: ThemeMode;
  palette: string;
  /** Resolved concrete mode (never "system"). */
  resolved: 'light' | 'dark';
  /** Custom color-wheel accent (only used when palette === "custom"). */
  customColor: CustomColor | null;
}

interface ThemeContextValue extends ThemeSnapshot {
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: string) => void;
  setCustomColor: (color: CustomColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// A tiny external store backed by localStorage + the system color-scheme
// preference. useSyncExternalStore gives us server-safe hydration (no flash /
// mismatch) without calling setState inside an effect.
// ---------------------------------------------------------------------------

let snapshot: ThemeSnapshot | null = null;
const listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

const SERVER_SNAPSHOT: ThemeSnapshot = {
  mode: 'system',
  palette: DEFAULT_PALETTE,
  resolved: 'light',
  customColor: null,
};

const SCALE_KEYS = ['50', '100', '200', '500', '600', '700', '900'] as const;

function systemIsDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'system';
}

function readStoredPalette(): string {
  if (typeof window === 'undefined') return DEFAULT_PALETTE;
  return localStorage.getItem(PALETTE_STORAGE_KEY) || DEFAULT_PALETTE;
}

function readStoredCustomColor(): CustomColor | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) || 'null');
    if (parsed && typeof parsed.h === 'number') {
      return {
        h: parsed.h,
        s: typeof parsed.s === 'number' ? parsed.s : 80,
        l: typeof parsed.l === 'number' ? parsed.l : 52,
      };
    }
  } catch {
    // ignore malformed value
  }
  return null;
}

function computeSnapshot(): ThemeSnapshot {
  const mode = readStoredMode();
  return {
    mode,
    palette: readStoredPalette(),
    resolved: mode === 'system' ? (systemIsDark() ? 'dark' : 'light') : mode,
    customColor: readStoredCustomColor(),
  };
}

function getSnapshot(): ThemeSnapshot {
  if (snapshot === null) snapshot = computeSnapshot();
  return snapshot;
}

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

/** Apply (or clear) the custom color-wheel accent as inline CSS variables. */
function applyCustomVars(s: ThemeSnapshot) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (s.palette === CUSTOM_PALETTE && s.customColor) {
    const { h, s: sat, l } = s.customColor;
    const scale = s.resolved === 'dark' ? generateDarkScale(h, sat, l) : generateScale(h, sat, l);
    for (const key of SCALE_KEYS) {
      el.style.setProperty(`--p-${key}`, scale[key]);
    }
  } else {
    for (const key of SCALE_KEYS) {
      el.style.removeProperty(`--p-${key}`);
    }
  }
}

function applyToDom(s: ThemeSnapshot) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.mode = s.resolved;
  document.documentElement.dataset.theme = s.palette;
  applyCustomVars(s);
}

function persist(s: ThemeSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, s.mode);
    localStorage.setItem(PALETTE_STORAGE_KEY, s.palette);
    if (s.customColor) {
      localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(s.customColor));
    }
  } catch {
    // storage may be unavailable (private mode) — ignore
  }
}

function emit() {
  snapshot = computeSnapshot();
  persist(snapshot);
  applyToDom(snapshot);
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (typeof window !== 'undefined' && !mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      snapshot = null; // force recompute on next read
      emit();
    });
  }
  return () => {
    listeners.delete(onChange);
  };
}

function setMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  snapshot = null;
  emit();
}

function setPalette(palette: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  // Ensure there is always a custom color to fall back on.
  if (palette === CUSTOM_PALETTE && !readStoredCustomColor()) {
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOM_COLOR));
  }
  snapshot = null;
  emit();
}

function setCustomColor(color: CustomColor) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, JSON.stringify(color));
  snapshot = null;
  emit();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // DOM attributes are applied by the pre-paint inline script (see layout.tsx)
  // and kept in sync by emit() whenever the store changes — no effect needed.

  return (
    <ThemeContext.Provider
      value={{
        mode: snap.mode,
        palette: snap.palette,
        resolved: snap.resolved,
        customColor: snap.customColor,
        setMode,
        setPalette,
        setCustomColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
