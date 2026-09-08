import type React from "react";

// ── Recipe "liquid glass" (mismo del sidebar rail) ──────────────────────
// Tres capas: efecto (backdrop capturado y deformado por el filtro SVG),
// tinte (color plano translúcido) y brillo (canto especular + halo).
// El filtro #liquido se define una sola vez en SaveTheDate.tsx.

// glass-filter: `isolation: isolate` es lo que hace que Chromium componga el
// backdrop dentro de la capa y lo deforme después.
export const GLASS_EFECTO: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  borderRadius: "inherit",
  backdropFilter: "blur(1.5px)",
  WebkitBackdropFilter: "blur(1.5px)",
  filter: "url(#liquido)",
  isolation: "isolate",
  pointerEvents: "none",
};

// glass-overlay
export const glassTinte = (color: string): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  borderRadius: "inherit",
  background: color,
  pointerEvents: "none",
});

// glass-specular
export const GLASS_BRILLO: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  borderRadius: "inherit",
  overflow: "hidden",
  boxShadow:
    "inset 1px 1px 0 rgba(255, 255, 255, 0.75), inset 0 0 5px rgba(255, 255, 255, 0.75)",
  pointerEvents: "none",
};
