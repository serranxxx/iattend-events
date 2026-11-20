/*
  Texto suelto de un Pop / side event (`body.stickers[n]`, `kind: "text"`).
  Puede llevar su propio tamaño (`size`, px de la pieza de 390 de ancho): la
  caja se estira a lo ancho sin cambiar la letra, y la barra de texto del
  editor le pone tipografía, peso, interlineado, cursiva, subrayado, tachado,
  mayúsculas, espaciado y alineación. Sin `size` (los de antes), la letra
  sale de su ancho, como siempre. Gemela: iattend-vite/src/modules/Editor/textoElemento.js.
*/
import type React from "react";
import type { PopSticker } from "@/types/side_event";

const ANCHO_PIEZA = 390;
const TEXT_FACTOR: Record<string, number> = { title: 0.16, subtitle: 0.1, body: 0.06 };
const PESO: Record<string, number> = { title: 600, subtitle: 500, body: 400 };

type Texto = PopSticker & {
  size?: number | null;
  weight?: number | null;
  line_height?: number | null;
  align?: string | null;
  italic?: boolean | null;
  underline?: boolean | null;
  strike?: boolean | null;
  transform?: string | null;
  letterSpacing?: number | null;
};

export const tamTexto = (s: Texto) => {
  if (typeof s.size === "number" && s.size > 0) return s.size;
  const variant = s.variant ?? "body";
  return ((s.w ?? 40) * (TEXT_FACTOR[variant] ?? 0.06) * ANCHO_PIEZA) / 100;
};

export const estiloTexto = (s: Texto, { titleFont, bodyFont = "Poppins", color }: { titleFont?: string; bodyFont?: string; color?: string }): React.CSSProperties => {
  const variant = s.variant ?? "body";
  const deco = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" ");
  return {
    color,
    fontFamily: s.font || (variant === "title" ? titleFont : bodyFont),
    fontWeight: s.weight ?? PESO[variant] ?? 400,
    fontSize: `${(tamTexto(s) / ANCHO_PIEZA) * 100}cqw`,
    ...(s.line_height ? { lineHeight: s.line_height } : {}),
    ...(s.align ? { textAlign: s.align as React.CSSProperties["textAlign"] } : {}),
    ...(s.italic ? { fontStyle: "italic" } : {}),
    ...(deco ? { textDecoration: deco } : {}),
    ...(s.transform && s.transform !== "none" ? { textTransform: s.transform as React.CSSProperties["textTransform"] } : {}),
    ...(typeof s.letterSpacing === "number" ? { letterSpacing: `${s.letterSpacing / 100}em` } : {}),
  };
};
