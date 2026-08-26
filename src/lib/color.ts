export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface CustomColor {
  h: number;
  s: number;
  l: number;
}

export type ScaleShades = Record<'50' | '100' | '200' | '500' | '600' | '700' | '900', string>;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Convert HSL (h: 0-360, s/l: 0-100) to a `#rrggbb` hex string. */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHsl(hex: string): HSL {
  const m = hex.replace('#', '');
  let r = 0;
  let g = 0;
  let b = 0;
  if (m.length === 3) {
    r = parseInt(m[0] + m[0], 16);
    g = parseInt(m[1] + m[1], 16);
    b = parseInt(m[2] + m[2], 16);
  } else {
    r = parseInt(m.slice(0, 2), 16);
    g = parseInt(m.slice(2, 4), 16);
    b = parseInt(m.slice(4, 6), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Generate a light-mode accent scale from a chosen "600" color. */
export function generateScale(h: number, s: number, l: number): ScaleShades {
  return {
    '50': hslToHex(h, s, Math.min(96, l + 44)),
    '100': hslToHex(h, s, Math.min(90, l + 34)),
    '200': hslToHex(h, s, Math.min(84, l + 24)),
    '500': hslToHex(h, s, Math.min(72, l + 10)),
    '600': hslToHex(h, s, l),
    '700': hslToHex(h, s, Math.max(12, l - 10)),
    '900': hslToHex(h, s, Math.max(8, l - 26)),
  };
}

/** Generate a dark-mode accent scale (brighter ink + dark-tinted soft shades). */
export function generateDarkScale(h: number, s: number, l: number): ScaleShades {
  return {
    '50': hslToHex(h, clamp(s - 20, 20, 100), 11),
    '100': hslToHex(h, clamp(s - 15, 20, 100), 17),
    '200': hslToHex(h, clamp(s - 10, 20, 100), 26),
    '500': hslToHex(h, s, Math.min(88, l + 24)),
    '600': hslToHex(h, s, Math.min(90, l + 18)),
    '700': hslToHex(h, s, Math.min(90, l + 24)),
    '900': hslToHex(h, s, Math.min(95, l + 38)),
  };
}

export const DEFAULT_CUSTOM_COLOR: CustomColor = { h: 220, s: 80, l: 52 };
