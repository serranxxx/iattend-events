"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// Catálogo de Bienvenida (handoff "Bienvenida Catálogo"). El estilo vive en
// greeting.style; "W1" (o vacío) es la clásica de siempre (Greeting.tsx, sin
// cambios). Aquí van:
//   W2 Itálica romántica   W3 Entre reglas   W5 Cita   W6 Enmarcada
//   W7 Arco                W8 Palabra por palabra
// Solo título + texto, todo centrado. Tamaños de la base (título con el de la
// invitación, texto 16px); cada opción cambia estilo, ritmo y adornos.
// Colores de la paleta: Contraste = secondary (si se lee), Textos = accent.
//
// Edición: Greeting.tsx pasa `title` / `text` (los textos editables encima).
// W8 no anima en el editor: ahí se escribe.

export const GREETING_STYLE_IDS = ["W1", "W2", "W3", "W5", "W6", "W7", "W8"] as const;
export type GreetingStyleId = (typeof GREETING_STYLE_IDS)[number];

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

// Entrada: la misma de la base (FadeLeft).
function Enter({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// W8: el texto palabra por palabra (respeta *negritas*).
function Words({ text, start, step, shown, reduced, style }: { text: string; start: number; step: number; shown: boolean; reduced: boolean; style: React.CSSProperties }) {
  const tokens: { w: string; strong: boolean }[] = [];
  text.split(/(\*[^*]+\*)/g).forEach((part) => {
    const strong = part.startsWith("*") && part.endsWith("*");
    (strong ? part.slice(1, -1) : part).split(/(\s+)/).forEach((w) => { if (w) tokens.push({ w, strong }); });
  });
  let k = 0;
  return (
    <span style={{ display: "block", whiteSpace: "pre-line", ...style }}>
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t.w)) return t.w.includes("\n") ? <br key={i} /> : <span key={i}> </span>;
        const delay = start + k++ * step;
        const word = t.strong ? <strong>{t.w}</strong> : t.w;
        return (
          <span key={i} style={{ display: "inline-block", opacity: shown || reduced ? 1 : 0, transform: shown || reduced ? "none" : "translateY(10px)", filter: shown || reduced ? "none" : "blur(4px)", transition: reduced ? undefined : `opacity .5s ease ${delay}s, transform .5s ease ${delay}s, filter .5s ease ${delay}s` }}>
            {word}
          </span>
        );
      })}
    </span>
  );
}

export type StyledGreetingProps = {
  styleId: Exclude<GreetingStyleId, "W1">;
  titleText: string;
  bodyText: string;
  title: (_style: React.CSSProperties) => React.ReactNode;
  text: (_style: React.CSSProperties) => React.ReactNode;
  ink: string;
  secondary: string;
  bg: string;
  serif: string;
  sans: string;
  titleSize: number;
  titleColor: string;
  titleWeight: number;
  editMode: boolean;
};

export function StyledGreeting(p: StyledGreetingProps) {
  const { styleId, titleText, bodyText, title, text, ink, secondary, bg, serif, sans, titleSize, titleColor, titleWeight, editMode } = p;
  const tone = contrast(secondary, bg) >= 3 ? secondary : alpha(ink, 0.6);
  const TEXT = 16; // tamaño del texto de la base
  const base: React.CSSProperties = { width: "100%", boxSizing: "border-box", color: ink, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" };
  const balance = { textWrap: "balance" } as React.CSSProperties;
  const pretty = { textWrap: "pretty" } as React.CSSProperties;

  // W8: se anima una vez al entrar en pantalla.
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (styleId !== "W8" || editMode || shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [styleId, editMode, shown]);

  switch (styleId) {
    // ── Itálica romántica ──
    case "W2":
      return (
        <Enter style={{ ...base, gap: 18 }}>
          {title({ fontStyle: "italic", fontWeight: 500, textTransform: "none", ...balance })}
          <span aria-hidden style={{ display: "flex", alignItems: "center", gap: 12, color: tone }}>
            <i style={{ width: 36, height: 1, background: tone }} /><span style={{ fontSize: 12 }}>✦</span><i style={{ width: 36, height: 1, background: tone }} />
          </span>
          {text({ fontFamily: serif, fontSize: TEXT, lineHeight: 1.55, ...pretty })}
        </Enter>
      );

    // ── Entre reglas ──
    case "W3":
      return (
        <Enter style={{ ...base, gap: 20 }}>
          <div style={{ width: "100%", borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`, padding: "16px 0" }}>
            {title({ fontFamily: sans, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", ...balance })}
          </div>
          {text({ fontFamily: serif, fontSize: TEXT, lineHeight: 1.55, ...pretty })}
        </Enter>
      );

    // ── Cita (el título va abajo, como firma) ──
    case "W5":
      return (
        <Enter style={{ ...base, gap: 14 }}>
          <span aria-hidden style={{ fontFamily: serif, fontSize: 80, lineHeight: 0.6, height: 34, opacity: 0.5, marginTop: 10 }}>“</span>
          {text({ fontFamily: serif, fontStyle: "italic", fontSize: TEXT, fontWeight: 500, lineHeight: 1.5, ...pretty })}
          {title({ fontFamily: sans, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", ...balance })}
        </Enter>
      );

    // ── Enmarcada ──
    case "W6":
      return (
        <Enter style={{ ...base, gap: 16, border: `1px solid ${tone}`, outline: `1px solid ${tone}`, outlineOffset: -6, padding: "30px 22px" }}>
          {title({ letterSpacing: 1, textTransform: "uppercase", ...balance })}
          {text({ fontFamily: sans, lineHeight: 1.7, ...pretty })}
        </Enter>
      );

    // ── Arco ──
    case "W7":
      return (
        <Enter style={{ ...base, gap: 16, border: `1.5px solid ${ink}`, borderBottom: "none", borderRadius: "999px 999px 0 0", padding: "70px 26px 30px" }}>
          {title({ textTransform: "none", ...balance })}
          {text({ fontFamily: sans, lineHeight: 1.7, ...pretty })}
        </Enter>
      );

    // ── Palabra por palabra ──
    case "W8": {
      if (editMode) {
        return (
          <div style={{ ...base, gap: 18 }}>
            {title({ textTransform: "none", ...balance })}
            {text({ fontFamily: sans, lineHeight: 1.7, ...pretty })}
          </div>
        );
      }
      const titleWords = titleText.split(/\s+/).filter(Boolean).length;
      return (
        <div ref={ref} style={{ ...base, gap: 18 }}>
          <Words text={titleText} start={0} step={0.09} shown={shown} reduced={reduced} style={{ fontFamily: serif, fontSize: titleSize, fontWeight: titleWeight, color: titleColor, lineHeight: 1.2, ...balance }} />
          <Words text={bodyText} start={titleWords * 0.09 + 0.2} step={0.035} shown={shown} reduced={reduced} style={{ fontFamily: sans, fontSize: TEXT, lineHeight: 1.7, ...pretty }} />
        </div>
      );
    }

    default:
      return null;
  }
}
