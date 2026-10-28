"use client";

import React from "react";
import { LAYER_ICONS } from "../SectionLayer/SectionLayer";

// Ícono de un momento elegido desde Elementos del editor (iattend-vite):
// "lucide:<Nombre>" (los mismos íconos de los elementos sueltos),
// "shape:<forma>" (contorno) o "svg:<url>" (SVG del catálogo). Del color del
// momento.
const SHAPES: Record<string, React.ReactNode> = {
  square: <rect x="6" y="6" width="88" height="88" />,
  rect: <rect x="4" y="22" width="92" height="56" />,
  circle: <circle cx="50" cy="50" r="44" />,
  triangle: <polygon points="50,6 94,92 6,92" />,
  star: <polygon points="50,6 61,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 39,38" />,
};

export function MomentGlyph({ icon, size = 24, color }: { icon: string; size?: number; color: string }) {
  if (icon.startsWith("svg:")) {
    const url = icon.slice(4);
    return (
      <span
        aria-hidden
        style={{
          display: "inline-block", width: size, height: size, backgroundColor: color,
          WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
        }}
      />
    );
  }
  if (icon.startsWith("lucide:")) {
    const Icon = LAYER_ICONS[icon.slice(7)];
    return Icon ? <Icon width={size} height={size} color={color} strokeWidth={1.6} /> : null;
  }
  const shape = SHAPES[icon.slice(6)];
  if (!shape) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round">
      {shape}
    </svg>
  );
}
