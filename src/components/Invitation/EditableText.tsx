"use client";

import React, { useEffect, useRef } from "react";

// Texto de la invitación que, en modo edición (/host desde el editor de
// iattend-vite), se escribe directo sobre la pieza. Ver docs/entorno-edicion.md
// en vite.
//
// Los textos admiten *negritas* con asteriscos (renderTextWithStrong). Al
// editar se muestran como <strong> y al leer se vuelven a serializar con los
// asteriscos, así el valor guardado es el mismo que escribe el panel.
//
// Mientras se teclea manda el DOM: React no vuelve a tocar el contenido y el
// valor solo se vuelve a copiar cuando cambia desde afuera y nadie está
// escribiendo. Si React lo reescribiera a cada letra, el caret saltaría.
// Para eso `dangerouslySetInnerHTML` recibe SIEMPRE el mismo objeto (un ref):
// React compara el objeto, no el string, y con uno nuevo por render volvía a
// escribir el HTML inicial encima de lo tecleado.

type Props = {
  path: string; // ruta del campo en la invitación, p. ej. "greeting.title"
  value: string;
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  multiline?: boolean; // Enter inserta salto; si no, suelta el foco
  as?: "span" | "p";
  className?: string;
  style?: React.CSSProperties;
  // Cómo se pinta fuera del modo edición (p. ej. renderTextWithStrong).
  render?: (_value: string) => React.ReactNode;
  // Texto gris que se ve mientras el campo está vacío (solo en edición).
  placeholder?: string;
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// "*negritas*" → <strong>negritas</strong>
export const markupToHtml = (text: string) =>
  escapeHtml(text).replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");

// DOM editado → texto con *asteriscos* y saltos de línea.
const serialize = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName;
  if (tag === "BR") return "\n";
  const inner = Array.from(el.childNodes).map(serialize).join("");
  if (tag === "STRONG" || tag === "B") return inner ? `*${inner}*` : "";
  // Los navegadores meten <div> o <p> por cada Enter.
  if (tag === "DIV" || tag === "P") return (el.previousSibling ? "\n" : "") + inner;
  return inner;
};

export function EditableText({ path, value, editMode = false, onFieldChange, multiline = false, as = "span", className, style, render, placeholder }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const initialHtml = useRef<{ __html: string } | null>(null);
  if (initialHtml.current === null) initialHtml.current = { __html: markupToHtml(value ?? "") };

  useEffect(() => {
    const el = ref.current;
    if (!editMode || !el || document.activeElement === el) return;
    const html = markupToHtml(value ?? "");
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [editMode, value]);

  const Tag = as;

  if (!editMode) {
    return <Tag className={className} style={style}>{render ? render(value ?? "") : (value ?? "")}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLParagraphElement>}
      className={className}
      style={{ outline: "none", cursor: "text", minWidth: "1ch", ...style }}
      data-edit-field={path}
      data-placeholder={placeholder}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => onFieldChange?.(path, serialize(e.currentTarget).replace(/\n+$/, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
      }}
      dangerouslySetInnerHTML={initialHtml.current}
    />
  );
}
