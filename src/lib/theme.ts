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
export const CUSTOM_PALETTE = 'custom';

export const MODE_STORAGE_KEY = 'aicrm-theme-mode';
export const PALETTE_STORAGE_KEY = 'aicrm-theme-palette';
export const CUSTOM_COLOR_STORAGE_KEY = 'aicrm-custom-color';

/**
 * Inline script injected into <head> to apply the saved theme before first
 * paint (prevents a flash of the wrong theme), including a custom color wheel
 * accent when one has been saved.
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

    if (p === '${CUSTOM_PALETTE}') {
      var c = JSON.parse(localStorage.getItem('${CUSTOM_COLOR_STORAGE_KEY}') || 'null');
      if (c && typeof c.h === 'number') {
        function hsl(h, s, l) {
          h = ((h % 360) + 360) % 360;
          s = Math.max(0, Math.min(100, s));
          l = Math.max(0, Math.min(100, l));
          var sn = s / 100, ln = l / 100, a = sn * Math.min(ln, 1 - ln);
          function f(n) {
            var k = (n + h / 30) % 12;
            var cc = ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
            return Math.round(255 * cc).toString(16).padStart(2, '0');
          }
          return '#' + f(0) + f(8) + f(4);
        }
        var el = document.documentElement;
        var sh;
        if (resolved === 'dark') {
          sh = {50: hsl(c.h, c.s - 20, 11), 100: hsl(c.h, c.s - 15, 17), 200: hsl(c.h, c.s - 10, 26),
                500: hsl(c.h, c.s, Math.min(88, c.l + 24)), 600: hsl(c.h, c.s, Math.min(90, c.l + 18)),
                700: hsl(c.h, c.s, Math.min(90, c.l + 24)), 900: hsl(c.h, c.s, Math.min(95, c.l + 38))};
        } else {
          sh = {50: hsl(c.h, c.s, Math.min(96, c.l + 44)), 100: hsl(c.h, c.s, Math.min(90, c.l + 34)),
                200: hsl(c.h, c.s, Math.min(84, c.l + 24)), 500: hsl(c.h, c.s, Math.min(72, c.l + 10)),
                600: hsl(c.h, c.s, c.l), 700: hsl(c.h, c.s, Math.max(12, c.l - 10)),
                900: hsl(c.h, c.s, Math.max(8, c.l - 26))};
        }
        for (var k in sh) el.style.setProperty('--p-' + k, sh[k]);
      }
    }
  } catch (e) {}
})();`;
