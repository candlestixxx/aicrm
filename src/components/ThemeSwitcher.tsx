'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Moon, Monitor, Palette, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { PALETTES, CUSTOM_PALETTE, type ThemeMode } from '@/lib/theme';
import { hslToHex } from '@/lib/color';
import ColorWheel from '@/components/ColorWheel';

const MODES: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { key: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
  { key: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
  { key: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
];

interface Preview {
  mode: ThemeMode;
  palette: string;
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Write the concrete theme to the DOM (module scope — allowed by the lint rules). */
function writeDom(concrete: 'light' | 'dark', palette: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.mode = concrete;
  document.documentElement.dataset.theme = palette;
}

export default function ThemeSwitcher() {
  const { mode, palette, resolved, customColor, setMode, setPalette } = useTheme();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const previewRef = useRef<Preview | null>(null);
  const committedRef = useRef({ resolved, palette });

  // Keep refs in sync (in an effect, not during render) for use in handlers/cleanup.
  useEffect(() => {
    previewRef.current = preview;
    committedRef.current = { resolved, palette };
  });

  const currentMode = preview?.mode ?? mode;
  const currentPalette = preview?.palette ?? palette;
  const isPreviewing =
    preview !== null && (preview.mode !== mode || preview.palette !== palette);

  const customHex = customColor ? hslToHex(customColor.h, customColor.s, customColor.l) : '#7c3aed';
  const activePalette =
    currentPalette === CUSTOM_PALETTE
      ? { id: CUSTOM_PALETTE, name: 'Custom', swatch: customHex }
      : PALETTES.find((p) => p.id === currentPalette) || PALETTES[0];

  function applyPreview(next: Preview) {
    setPreview(next);
    writeDom(resolveMode(next.mode), next.palette);
  }

  function previewMode(nextMode: ThemeMode) {
    applyPreview({ mode: nextMode, palette: preview?.palette ?? palette });
  }

  function previewPalette(nextPalette: string) {
    applyPreview({ mode: preview?.mode ?? mode, palette: nextPalette });
  }

  function commit(next: Preview) {
    setMode(next.mode);
    setPalette(next.palette);
    setPreview(null);
    setOpen(false);
  }

  function commitMode(nextMode: ThemeMode) {
    commit({ mode: nextMode, palette: preview?.palette ?? palette });
  }

  function commitPalette(nextPalette: string) {
    commit({ mode: preview?.mode ?? mode, palette: nextPalette });
  }

  function cancel() {
    setPreview(null);
    writeDom(resolved, palette);
  }

  // Close (and revert any pending preview) on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const revertAndClose = () => {
      if (previewRef.current) {
        setPreview(null);
        writeDom(committedRef.current.resolved, committedRef.current.palette);
      }
      setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) revertAndClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') revertAndClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // If we unmount with a pending preview (e.g. navigation), restore committed.
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        writeDom(committedRef.current.resolved, committedRef.current.palette);
      }
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (open) cancel();
          setOpen((o) => !o);
        }}
        aria-label="Appearance settings"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
      >
        {resolved === 'dark' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
        <span
          className="w-3 h-3 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: activePalette.swatch }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-surface border border-gray-200 rounded-xl shadow-xl p-4 z-50"
          onMouseLeave={cancel}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Appearance
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onMouseEnter={() => previewMode(m.key)}
                onClick={() => commitMode(m.key)}
                className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition border ${
                  currentMode === m.key
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {m.icon}
                {m.label}
                {mode === m.key && (
                  <Check className="w-3 h-3 absolute top-1 right-1 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <Palette className="w-3.5 h-3.5" /> Accent color
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => previewPalette(p.id)}
                onClick={() => commitPalette(p.id)}
                title={p.name}
                className={`relative flex items-center justify-center gap-1.5 px-1 py-2 rounded-lg text-xs transition border ${
                  currentPalette === p.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: p.swatch }}
                />
                <span className="text-gray-600">{p.name}</span>
                {palette === p.id && (
                  <Check className="w-3 h-3 absolute top-1 right-1 text-blue-600" />
                )}
              </button>
            ))}

            {/* Custom color wheel entry */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setWheelOpen(true);
              }}
              title="Custom color"
              className={`relative flex items-center justify-center gap-1.5 px-1 py-2 rounded-lg text-xs transition border ${
                currentPalette === CUSTOM_PALETTE
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full ring-1 ring-black/10"
                style={{
                  background:
                    'conic-gradient(from 0deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))',
                }}
              />
              <span className="text-gray-600">Custom</span>
              {palette === CUSTOM_PALETTE && (
                <Check className="w-3 h-3 absolute top-1 right-1 text-blue-600" />
              )}
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] text-gray-500">
            {isPreviewing ? (
              <>Previewing {resolveMode(currentMode)} · {activePalette.name} — click to apply</>
            ) : (
              <>
                {resolved === 'dark' ? 'Dark' : 'Light'} theme · {activePalette.name} accent
                {mode === 'system' && ' (following system)'} — hover to preview
              </>
            )}
          </div>
        </div>
      )}

      {wheelOpen && <ColorWheel open onClose={() => setWheelOpen(false)} />}
    </div>
  );
}
