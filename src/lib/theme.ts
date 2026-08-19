export type ThemeMode = 'light' | 'dark' | 'system';

export interface Palette {
  id: string;
  name: string;
  swatch: string;
}

export const PALETTES: Palette[] = [
  { id: 'ocean', name: 'Ocean', swatch: '#2563eb' },
  { id: 'violet', name: 'Violet', swatch: '#7c3aed' },
  { id: 'teal', name: 'Teal', swatch: '#0d9488' },
  { id: 'rose', name: 'Rose', swatch: '#e11d48' },
  { id: 'amber', name: 'Amber', swatch: '#d97706' },
  { id: 'slate', name: 'Slate', swatch: '#475569' },
];

export const DEFAULT_PALETTE = 'ocean';

export const MODE_STORAGE_KEY = 'aicrm-theme-mode';
export const PALETTE_STORAGE_KEY = 'aicrm-theme-palette';

/**
 * Inline script injected into <head> to apply the saved theme before first
 * paint (prevents a flash of the wrong theme).
 */
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var m = localStorage.getItem('${MODE_STORAGE_KEY}');
    var mode = (m === 'light' || m === 'dark') ? m : 'system';
    var resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var p = localStorage.getItem('${PALETTE_STORAGE_KEY}');
    document.documentElement.dataset.mode = resolved;
    document.documentElement.dataset.theme = p || '${DEFAULT_PALETTE}';
  } catch (e) {}
})();`;
