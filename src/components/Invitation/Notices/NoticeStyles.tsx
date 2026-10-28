"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

// Catálogo de Recordatorios / avisos (handoff "Recordatorios Catálogo"). El
// estilo vive en notices.style; "R1" (o vacío) es el apilado de siempre
// (Notices.tsx, sin cambios). Aquí van:
//   R2 Numerado editorial   R4 Notas adhesivas   R5 Uno a la vez
//   R6 Checklist            R7 Guía del invitado R8 Mensajes de la pareja
// Solo texto: cada aviso es el texto que escribió el usuario (números,
// separadores y rotaciones salen solos de su posición). Colores de la paleta:
// Fondo = primary, Contraste = secondary, Textos = accent, Acento = actions.
//
// Edición: Notices.tsx pasa `row` (renglón arrastrable de useEditableList),
// `text` (el texto editable encima) y `del` (Eliminar); los renglones son hijos
// directos de `listRef`.

export const NOTICE_STYLE_IDS = ["R1", "R2", "R4", "R5", "R6", "R7", "R8"] as const;
export type NoticeStyleId = (typeof NOTICE_STYLE_IDS)[number];

const EASE = "cubic-bezier(.2,.8,.2,1)";

const rgb = (hex: string) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex ?? "");
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number) => {
  const x = rgb(a), y = rgb(b);
  return `#${x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const alpha = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };

// "Ale & Santiago" → "A&S"
const monogram = (title: string) => {
  const parts = title.split(/\s*(?:&|\by\b|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}&${parts[1][0]}`.toUpperCase();
  return (title.trim()[0] ?? "").toUpperCase();
};

// Entrada de cada aviso: la misma de los avisos base (FadeLeft: desde -40px,
// 1s, una vez al entrar en pantalla), pero con el estilo del renglón.
// `delay`: escalonado (las burbujas de R8 aparecen una por una).
function Enter({ style, delay = 0, children }: { style?: React.CSSProperties; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay }}
      viewport={{ once: true, amount: 0.3 }}
      style={{ position: "relative", ...style }}
    >
      {children}
    </motion.div>
  );
}

type Colors = { primary: string; secondary: string; accent: string; actions: string };

export type StyledNoticesProps = {
  styleId: Exclude<NoticeStyleId, "R1">;
  items: string[];
  colors: Colors;
  ink: string;
  sans: string;
  serif: string;
  names: string;
  editMode: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  row: (_index: number, _style?: React.CSSProperties) => Record<string, unknown>;
  text: (_index: number, _style: React.CSSProperties) => React.ReactNode;
  del: (_index: number) => React.ReactNode;
};

export function StyledNotices(p: StyledNoticesProps) {
  const { styleId, items, colors, ink, sans, serif, names, editMode, listRef, row, text, del } = p;
  const n = items.length;

  // R5
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);
  const touchX = useRef<number | null>(null);
  useEffect(() => { if (cur >= n) setCur(0); }, [n]);
  const go = (d: number) => { if (n < 2) return; setDir(d); setCur((k) => (k + d + n) % n); };

  // R6: marcas solo en este dispositivo (por invitación: su dirección).
  const storeKey = typeof window !== "undefined" ? `iattend_checklist:${window.location.pathname}` : "";
  const [done, setDone] = useState<boolean[]>([]);
  useEffect(() => {
    if (styleId !== "R6" || !storeKey) return;
    try { setDone(JSON.parse(localStorage.getItem(storeKey) ?? "[]")); } catch { setDone([]); }
  }, [styleId, storeKey]);
  const toggle = (i: number) => {
    if (editMode) return;
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
      return next;
    });
  };

  const base: React.CSSProperties = { width: "100%", boxSizing: "border-box", color: ink };

  switch (styleId) {
    // ── Numerado editorial ──
    case "R2":
      return (
        <div ref={listRef} style={{ ...base, display: "flex", flexDirection: "column", textAlign: "left" }}>
          {items.map((_, i) => (
            <div key={i} {...row(i)}>
              <Enter style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 12, padding: "14px 0" }}>
                {/* Regla recta (no el borde del renglón: en el editor lleva esquinas redondeadas). */}
                <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: ink }} />
                <span style={{ fontFamily: serif, fontSize: 34, fontWeight: 500, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  {text(i, { fontFamily: sans, fontSize: 15, lineHeight: 1.55, textAlign: "left" })}
                  {del(i)}
                </div>
              </Enter>
            </div>
          ))}
        </div>
      );

    // ── Notas adhesivas ──
    case "R4": {
      // Tintes de la paleta, en ciclo; sobre un Fondo oscuro se mezcla con
      // blanco para que la nota siga clara.
      const paper = luminance(colors.primary) < 0.35 ? "#FFFFFF" : colors.primary;
      const tints = [mix(colors.secondary, paper, 0.38), mix(colors.actions, paper, 0.6), mix(colors.secondary, paper, 0.18)];
      // Texto: el de la paleta si se lee (≥ 4.5:1); si no, casi negro.
      const readable = (bg: string) => {
        const [a, b] = [luminance(bg), luminance(colors.accent)].sort((x, y) => y - x);
        return (a + 0.05) / (b + 0.05) >= 4.5 ? colors.accent : "#29262D";
      };
      const W = ["88%", "92%", "70%"], A = ["flex-start", "flex-end", "center"], R = [-2, 1.5, -1];
      return (
        <>
          <div ref={listRef} style={{ ...base, display: "flex", flexDirection: "column", gap: 22, padding: "8px 0" }}>
            {items.map((_, i) => {
              const bg = tints[i % 3];
              return (
                <div key={i} {...row(i)}>
                  <Enter style={{ display: "flex", flexDirection: "column", alignItems: A[i % 3] }}>
                  <div style={{ position: "relative", width: W[i % 3], background: bg, padding: "22px 18px 18px", boxShadow: "0 8px 16px rgba(0,0,0,.12)", transform: `rotate(${R[i % 3]}deg)`, boxSizing: "border-box", textAlign: "left" }}>
                    <span style={{ position: "absolute", left: "50%", top: -9, width: 64, height: 20, marginLeft: -32, background: "rgba(255,255,255,.55)", transform: "rotate(-3deg)", boxShadow: "0 1px 2px rgba(0,0,0,.06)" }} />
                    {text(i, { fontFamily: sans, fontSize: 16, lineHeight: 1.45, color: readable(bg), textAlign: "left" })}
                  </div>
                  {del(i)}
                  </Enter>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    // ── Uno a la vez ──
    case "R5": {
      const i0 = Math.min(cur, Math.max(0, n - 1));
      const arrow = (d: number, Icon: React.ElementType, label: string) => (
        <button type="button" aria-label={label} data-edit-row-delete onClick={(e) => { e.stopPropagation(); go(d); }} style={{ width: 40, height: 40, border: "none", borderRadius: "50%", background: alpha(ink, 0.08), color: ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Icon size={18} />
        </button>
      );
      return (
        <div
          style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
        >
          <Enter style={{ width: "100%" }}>
          <div
            onClick={() => !editMode && go(1)}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            }}
            style={{ width: "100%", minHeight: 190, border: `1px solid ${alpha(ink, 0.3)}`, borderRadius: 18, padding: "28px 22px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: editMode || n < 2 ? undefined : "pointer" }}
          >
            {/* Todos apilados en la misma celda: la tarjeta toma el alto del
                aviso más largo y no salta al cambiar. */}
            <div ref={listRef} aria-live="polite" style={{ display: "grid", width: "100%", flex: 1, alignItems: "center" }}>
              {items.map((_, i) => {
                const on = i === i0;
                return (
                  <div key={i} {...row(i, { gridArea: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: on ? 1 : 0, transform: on ? "translateX(0)" : `translateX(${(i < i0 ? -1 : 1) * dir * 24}px)`, transition: `opacity .4s ${EASE}, transform .4s ${EASE}`, pointerEvents: on ? "auto" : "none", visibility: on ? "visible" : "hidden" })} aria-hidden={!on}>
                    {text(i, { fontFamily: serif, fontSize: 21, fontWeight: 500, lineHeight: 1.4, textAlign: "center" })}
                    {on && del(i)}
                  </div>
                );
              })}
            </div>
            {n > 1 && <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 2, opacity: 0.6 }}>{String(i0 + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>}
          </div>
          </Enter>
          {n > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {arrow(-1, ChevronLeft, "Anterior")}
              <div style={{ display: "flex", gap: 6 }}>
                {items.map((_, i) => <span key={i} style={{ width: i === i0 ? 18 : 6, height: 6, borderRadius: 99, background: i === i0 ? ink : alpha(ink, 0.25), transition: "width .3s" }} />)}
              </div>
              {arrow(1, ChevronRight, "Siguiente")}
            </div>
          )}
        </div>
      );
    }

    // ── Checklist ──
    case "R6": {
      const count = items.filter((_, i) => done[i]).length;
      return (
        <div style={{ ...base, display: "flex", flexDirection: "column", gap: 14 }}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            {items.map((_, i) => {
              const on = Boolean(done[i]);
              return (
                <div key={i} {...row(i)}>
                  <Enter style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0" }}>
                  {i > 0 && <span style={{ position: "absolute", left: 0, right: 0, top: 0, borderTop: `1px dashed ${alpha(ink, 0.35)}` }} />}
                  <span
                    role="checkbox"
                    aria-checked={on}
                    tabIndex={editMode ? -1 : 0}
                    data-edit-row-delete
                    onClick={(e) => { e.stopPropagation(); toggle(i); }}
                    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(i); } }}
                    style={{ flex: "none", width: 24, height: 24, marginTop: 1, borderRadius: 7, border: `1.5px solid ${colors.secondary}`, background: on ? colors.secondary : "transparent", color: colors.primary, display: "grid", placeItems: "center", boxSizing: "border-box", cursor: editMode ? undefined : "pointer", transition: "background .2s" }}
                  >
                    {on && <Check size={15} strokeWidth={3} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, opacity: on ? 0.5 : 1, transition: "opacity .2s" }}>
                    {text(i, { fontFamily: sans, fontSize: 15, lineHeight: 1.5, textAlign: "left" })}
                    {del(i)}
                  </div>
                  </Enter>
                </div>
              );
            })}
          </div>
          <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: 1, opacity: 0.6 }}>{count} de {n} listos</span>
        </div>
      );
    }

    // ── Guía del invitado ──
    case "R7":
      return (
        <div style={{ ...base, border: `1px solid ${colors.secondary}`, outline: `1px solid ${colors.secondary}`, outlineOffset: -6, padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 4, opacity: 0.75 }}>GUÍA DEL INVITADO</span>
          <div ref={listRef} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {items.map((_, i) => (
              <div key={i} {...row(i, { width: "100%" })}>
                <Enter style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {text(i, { fontFamily: serif, fontSize: 18, fontWeight: 500, lineHeight: 1.45, textAlign: "center" })}
                  {del(i)}
                  {i < n - 1 && <span style={{ fontSize: 10, letterSpacing: 6, opacity: 0.55, padding: "12px 0" }}>✦ ✦ ✦</span>}
                </Enter>
              </div>
            ))}
          </div>
        </div>
      );

    // ── Mensajes de la pareja ──
    case "R8":
      return (
        <div style={{ ...base, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", background: colors.secondary, color: colors.primary, display: "grid", placeItems: "center", fontFamily: serif, fontSize: 12, fontWeight: 600 }}>{monogram(names)}</span>
            <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600 }}>{names}</span>
          </div>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((_, i) => (
              <div key={i} {...row(i)}>
                <Enter delay={i * 0.15} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <div style={{ maxWidth: "88%", background: "#FFFFFF", borderRadius: "4px 18px 18px 18px", padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", boxSizing: "border-box" }}>
                    {text(i, { fontFamily: sans, fontSize: 14.5, lineHeight: 1.5, color: "#29262D", textAlign: "left" })}
                  </div>
                  {del(i)}
                </Enter>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
