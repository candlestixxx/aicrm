'use client';

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
} from 'react';
import {
  DEFAULT_PALETTE,
  MODE_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeSnapshot {
  mode: ThemeMode;
  palette: string;
  /** Resolved concrete mode (never "system"). */
  resolved: 'light' | 'dark';
}

interface ThemeContextValue extends ThemeSnapshot {
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: string) => void;
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
};

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

function computeSnapshot(): ThemeSnapshot {
  const mode = readStoredMode();
  return {
    mode,
    palette: readStoredPalette(),
    resolved: mode === 'system' ? (systemIsDark() ? 'dark' : 'light') : mode,
  };
}

function getSnapshot(): ThemeSnapshot {
  if (snapshot === null) snapshot = computeSnapshot();
  return snapshot;
}

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

function applyToDom(s: ThemeSnapshot) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.mode = s.resolved;
  document.documentElement.dataset.theme = s.palette;
}

function persist(s: ThemeSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, s.mode);
    localStorage.setItem(PALETTE_STORAGE_KEY, s.palette);
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
        setMode,
        setPalette,
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
