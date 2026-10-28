"use client";

import React from "react";
import { motion } from "motion/react";
import { Person } from "@/types/new_invitation";

// Catálogo de Personas importantes (handoff "Personas Catálogo"). El estilo
// vive en people.style; "P1" (o vacío) es el apilado de siempre (Family.tsx,
// sin cambios). Aquí van:
//   P2 Dos columnas   P3 Serif con ornamento   P4 Lista con reglas
//   P5 Tarjetas       P6 Iniciales
// Solo rol y nombre, todo centrado, con los tamaños de la base: nombre 16px
// (g_mdoule_regular_text) y rol 14px (g_mdoule_light_text). Colores de la paleta: Fondo = primary,
// Contraste = secondary, Textos = accent.
//
// Edición: Family.tsx pasa `row` (renglón arrastrable de useEditableList),
// `role` / `name` (los textos editables encima) y `del` (Eliminar); los
// renglones son hijos directos de `listRef`.

export const PEOPLE_STYLE_IDS = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;
export type PeopleStyleId = (typeof PEOPLE_STYLE_IDS)[number];

const rgb = (hex: string) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex ?? "");
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const alpha = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };

// "Luis y Carmen Ortiz" → "LC": primera letra de las dos primeras palabras
// con mayúscula.
const initials = (name: string) => {
  const caps = (name ?? "").split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
  const words = caps.length ? caps : (name ?? "").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

// Entrada de cada persona: la misma de la base (FadeLeft: desde -40px, 1s,
// una vez al entrar en pantalla), con el estilo del renglón.
function Enter({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      style={{ position: "relative", ...style }}
    >
      {children}
    </motion.div>
  );
}

export type StyledPeopleProps = {
  styleId: Exclude<PeopleStyleId, "P1">;
  items: Person[];
  colors: { primary: string; secondary: string; accent: string };
  bg: string; // fondo del bloque (para que el color Contraste se lea)
  // Tarjetas (P5): color de la invitación (secondary, o primary con fondo e
  // invertido) y su texto (sobre secondary, primary; sobre primary, accent).
  surface: string;
  onSurface: string;
  ink: string;
  sans: string;
  serif: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  row: (_index: number, _style?: React.CSSProperties) => Record<string, unknown>;
  role: (_index: number, _style: React.CSSProperties) => React.ReactNode;
  name: (_index: number, _style: React.CSSProperties) => React.ReactNode;
  del: (_index: number) => React.ReactNode;
};

export function StyledPeople(p: StyledPeopleProps) {
  const { styleId, items, colors, bg, surface, onSurface, ink, sans, serif, listRef, row, role, name, del } = p;
  const n = items.length;
  // Contraste (secondary) para roles, ornamentos y bordes; si no se lee sobre
  // el fondo del bloque, el color de los textos atenuado.
  const tone = contrast(colors.secondary, bg) >= 3 ? colors.secondary : alpha(ink, 0.65);
  const base: React.CSSProperties = { width: "100%", boxSizing: "border-box", color: ink, textAlign: "center" };
  const NAME = 16, ROLE = 14; // tamaños de la base
  const caps = (size: number, spacing: number): React.CSSProperties => ({ fontFamily: sans, fontSize: size, fontWeight: 500, letterSpacing: spacing, textTransform: "uppercase", textAlign: "center" });
  // Grids de 2: con cantidad impar, la última ocupa las dos columnas.
  const spans = (i: number) => n % 2 === 1 && i === n - 1;

  switch (styleId) {
    // ── Dos columnas ──
    case "P2":
      return (
        <div ref={listRef} style={{ ...base, display: "grid", gridTemplateColumns: n > 1 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", rowGap: 22 }}>
          {items.map((_, i) => {
            const left = n > 1 && i % 2 === 0 && !spans(i);
            return (
              <div key={i} {...row(i, spans(i) ? { gridColumn: "1 / -1" } : undefined)}>
                <Enter style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0 12px", borderRight: left ? `1px solid ${alpha(ink, 0.3)}` : undefined, height: "100%", justifyContent: "center", boxSizing: "border-box" }}>
                  {role(i, { ...caps(ROLE, 1), color: tone })}
                  {name(i, { fontFamily: serif, fontSize: NAME, fontWeight: 600, lineHeight: 1.3, textAlign: "center" })}
                  {del(i)}
                </Enter>
              </div>
            );
          })}
        </div>
      );

    // ── Serif con ornamento ──
    case "P3":
      return (
        <div ref={listRef} style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {items.map((_, i) => (
            <div key={i} {...row(i, { width: "100%" })}>
              <Enter style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {name(i, { fontFamily: serif, fontSize: NAME, fontWeight: 600, lineHeight: 1.3, textAlign: "center" })}
                {role(i, { ...caps(ROLE, 1.5), opacity: 0.75 })}
                {del(i)}
                {i < n - 1 && <span style={{ color: tone, fontSize: 13, padding: "14px 0" }}>✦</span>}
              </Enter>
            </div>
          ))}
        </div>
      );

    // ── Lista con reglas ──
    case "P4":
      return (
        <div ref={listRef} style={{ ...base, display: "flex", flexDirection: "column" }}>
          {items.map((_, i) => (
            <div key={i} {...row(i)}>
              <Enter style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "16px 0" }}>
                {/* Regla recta (no el borde del renglón: en el editor lleva esquinas redondeadas). */}
                <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: ink }} />
                {role(i, { ...caps(ROLE, 1), opacity: 0.75 })}
                {name(i, { fontFamily: serif, fontSize: NAME, fontWeight: 600, lineHeight: 1.3, textAlign: "center" })}
                {del(i)}
              </Enter>
            </div>
          ))}
        </div>
      );

    // ── Tarjetas ──
    case "P5":
      return (
        <div ref={listRef} style={{ ...base, display: "grid", gridTemplateColumns: n > 1 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", gap: 10, gridAutoRows: "1fr" }}>
          {items.map((_, i) => (
            <div key={i} {...row(i, spans(i) ? { gridColumn: "1 / -1" } : undefined)}>
              <Enter style={{ height: "100%", minHeight: 110, background: surface, borderRadius: 18, padding: "18px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
                {role(i, { fontFamily: sans, fontSize: ROLE, color: onSurface, opacity: 0.75, textAlign: "center" })}
                {name(i, { fontFamily: sans, fontSize: NAME, fontWeight: 600, color: onSurface, lineHeight: 1.3, textAlign: "center" })}
                {del(i)}
              </Enter>
            </div>
          ))}
        </div>
      );

    // ── Iniciales ──
    case "P6":
      return (
        <div ref={listRef} style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {items.map((it, i) => (
            <div key={i} {...row(i, { width: "100%" })}>
              <Enter style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span aria-hidden style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${tone}`, display: "grid", placeItems: "center", fontFamily: serif, fontSize: 18, fontWeight: 600, boxSizing: "border-box" }}>{initials(it.description ?? "")}</span>
                {name(i, { fontFamily: sans, fontSize: NAME, fontWeight: 600, lineHeight: 1.3, textAlign: "center" })}
                {role(i, { fontFamily: sans, fontSize: ROLE, opacity: 0.75, textAlign: "center" })}
                {del(i)}
              </Enter>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
