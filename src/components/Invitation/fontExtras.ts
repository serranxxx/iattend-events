import React, { createContext } from "react";
import type { Font } from "@/types/new_invitation";

// Estilo extra de un texto de la invitación (barra de texto del editor de
// iattend-vite): cursiva, subrayado, tachado, mayúsculas, espaciado entre
// letras y entre renglones. Sin valores, no cambia nada.
export const fontExtras = (font?: Partial<Font> | null): React.CSSProperties => {
  if (!font) return {};
  const decoration = [font.underline && "underline", font.strike && "line-through"].filter(Boolean).join(" ");
  return {
    ...(font.italic ? { fontStyle: "italic" } : {}),
    ...(decoration ? { textDecoration: decoration } : {}),
    ...(font.transform && font.transform !== "none" ? { textTransform: font.transform } : {}),
    ...(typeof font.letterSpacing === "number" ? { letterSpacing: `${font.letterSpacing / 100}em` } : {}),
    ...(typeof font.lineHeight === "number" ? { lineHeight: font.lineHeight } : {}),
  };
};

// ── Estilo de los textos de los bloques (barra de texto del editor) ──
// Títulos = el título de cada bloque ("greeting.title", "notices.title"…);
// todo lo demás editable es cuerpo. La portada y la Cita tienen lo suyo.
export const textKind = (path: string): "title" | "body" | null => {
  if (path.startsWith("cover.") || path.startsWith("quote.")) return null;
  return /^[a-z_]+\.title$/.test(path) ? "title" : "body";
};

// Estilo propio de un texto (candado abierto en el editor), guardado en
// invitation.text_styles[ruta].
export type TextStyle = Partial<Font> & { align?: "left" | "center" | "right" | null };

export const overrideStyle = (o?: TextStyle | null): React.CSSProperties => {
  if (!o) return {};
  return {
    ...(o.typeFace ? { fontFamily: o.typeFace } : {}),
    ...(o.size ? { fontSize: `${o.size}px` } : {}),
    ...(o.weight ? { fontWeight: o.weight } : {}),
    ...(typeof o.opacity === "number" ? { opacity: o.opacity } : {}),
    ...(o.color ? { color: o.color } : {}),
    ...(o.align ? { textAlign: o.align } : {}),
    ...fontExtras(o),
  };
};

// Lo pone Invitation.tsx: estilos propios y las fuentes generales (para los
// extras globales de títulos / cuerpo: cursiva, subrayado, espaciado…).
export const TextStylesContext = createContext<{ styles: Record<string, TextStyle>; titles?: Partial<Font>; body?: Partial<Font> }>({ styles: {} });
