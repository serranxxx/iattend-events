import type { CSSProperties } from "react";
import { darker } from "@/helpers/functions";

// Efectos de la portada: sombra (cover.image.background) y desenfoque
// (cover.image.blur). Sus ajustes viven en cover.image.shadow_settings y
// cover.image.blur_settings; los edita iattend-vite (CoverEffects.jsx, con
// los mismos valores por defecto). Sin ajustes, los defaults reproducen
// exactamente cómo se veían antes de que existieran.

export type ShadowSettings = {
  color?: string | null; // null = un tono oscuro del color de la invitación
  strength?: number; // 0–100
  direction?: "up" | "down" | "both"; // up = sube desde abajo
  reach?: number; // 10–100, % del alto que cubre
};

export type BlurSettings = {
  amount?: number; // px
  direction?: "down" | "up" | "full"; // down = en la parte de abajo
  reach?: number; // 10–100, % del alto que cubre
};

export const SHADOW_DEFAULTS = { strength: 100, direction: "up", reach: 100 } as const;
export const BLUR_DEFAULTS = { amount: 6, direction: "down", reach: 40 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const shadowColor = (settings: ShadowSettings | null | undefined, primary: string) =>
  settings?.color || darker(primary, 0.2) || "#000000";

// Degradado de la sombra. Se pinta con mix-blend-mode multiply (como siempre):
// oscurece la foto con el tono elegido en vez de taparla.
export const shadowBackground = (settings: ShadowSettings | null | undefined, primary: string): string => {
  const strength = clamp(settings?.strength ?? SHADOW_DEFAULTS.strength, 0, 100);
  const reach = clamp(settings?.reach ?? SHADOW_DEFAULTS.reach, 10, 100);
  const direction = settings?.direction ?? SHADOW_DEFAULTS.direction;
  const base = shadowColor(settings, primary);
  const color = strength >= 100 ? base : `color-mix(in srgb, ${base} ${strength}%, transparent)`;

  if (direction === "both") {
    const half = reach / 2;
    return `linear-gradient(to bottom, ${color} 0%, transparent ${half}%, transparent ${100 - half}%, ${color} 100%)`;
  }
  return `linear-gradient(${direction === "down" ? "to bottom" : "to top"}, ${color} 0%, transparent ${reach}%)`;
};

// Desenfoque: backdrop-filter con una máscara que decide dónde se ve.
export const blurStyle = (settings: BlurSettings | null | undefined): CSSProperties => {
  const amount = clamp(settings?.amount ?? BLUR_DEFAULTS.amount, 0, 40);
  const reach = clamp(settings?.reach ?? BLUR_DEFAULTS.reach, 10, 100);
  const direction = settings?.direction ?? BLUR_DEFAULTS.direction;
  const filter = `blur(${amount}px)`;

  if (direction === "full") {
    return { backdropFilter: filter, WebkitBackdropFilter: filter, mask: "none", WebkitMask: "none" };
  }

  // Rampa suave de la mitad del alcance entre nada y desenfoque completo.
  const start = 100 - reach;
  const end = Math.min(100, start + reach / 2);
  const mask = `linear-gradient(${direction === "up" ? "to top" : "to bottom"}, transparent ${start}%, black ${end}%)`;
  return { backdropFilter: filter, WebkitBackdropFilter: filter, mask, WebkitMask: mask };
};
