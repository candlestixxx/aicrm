'use client';

import React, { useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { generateDarkScale, generateScale, hslToHex, type CustomColor } from '@/lib/color';

interface ColorWheelProps {
  open: boolean;
  onClose: () => void;
}

const SCALE_ORDER = ['50', '100', '200', '500', '600', '700', '900'] as const;

export default function ColorWheel({ open, onClose }: ColorWheelProps) {
  const { customColor, resolved, setCustomColor, setPalette } = useTheme();
  const [color, setColor] = useState<CustomColor>(
    customColor || { h: 220, s: 80, l: 52 }
  );
  const wheelRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const hex = hslToHex(color.h, color.s, color.l);
  const scale = resolved === 'dark' ? generateDarkScale(color.h, color.s, color.l) : generateScale(color.h, color.s, color.l);

  const handleRad = (color.h * Math.PI) / 180;
  const handleX = 50 + 40 * Math.sin(handleRad);
  const handleY = 50 - 40 * Math.cos(handleRad);

  function updateHue(clientX: number, clientY: number) {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    if (Math.sqrt(dx * dx + dy * dy) < 4) return;
    let hue = (Math.atan2(dx, -dy) * 180) / Math.PI;
    hue = (hue + 360) % 360;
    setColor((c) => ({ ...c, h: Math.round(hue) }));
  }

  function apply() {
    setCustomColor(color);
    setPalette('custom');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-gray-200 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Custom accent color</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Hue wheel */}
          <div className="flex flex-col items-center gap-3">
            <div
              ref={wheelRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                updateHue(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) updateHue(e.clientX, e.clientY);
              }}
              className="relative w-44 h-44 rounded-full cursor-crosshair select-none touch-none"
              style={{
                background:
                  'conic-gradient(from 0deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))',
              }}
            >
              {/* center swatch */}
              <div
                className="absolute rounded-full border-2 border-white shadow"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '44%',
                  height: '44%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: hex,
                }}
              />
              {/* handle */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{
                  left: `${handleX}%`,
                  top: `${handleY}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: hex,
                }}
              />
            </div>
            <div className="text-xs text-gray-600 font-mono">
              {hex} · H{color.h}
            </div>
          </div>

          {/* Sliders + palette preview */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Saturation — {color.s}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={color.s}
                onChange={(e) => setColor((c) => ({ ...c, s: Number(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${color.h} 0% ${color.l}%), hsl(${color.h} 100% ${color.l}%))`,
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Lightness — {color.l}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={color.l}
                onChange={(e) => setColor((c) => ({ ...c, l: Number(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${color.h} ${color.s}% 0%), hsl(${color.h} ${color.s}% 50%), hsl(${color.h} ${color.s}% 100%))`,
                }}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Generated scale</p>
              <div className="flex gap-1">
                {SCALE_ORDER.map((k) => (
                  <div key={k} className="flex-1 text-center">
                    <div
                      className="h-8 rounded-md border border-gray-200"
                      style={{ backgroundColor: scale[k] }}
                    />
                    <span className="text-[10px] text-gray-400">{k}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ backgroundColor: hex }}
          >
            <Check className="w-4 h-4" /> Apply custom color
          </button>
        </div>
      </div>
    </div>
  );
}
