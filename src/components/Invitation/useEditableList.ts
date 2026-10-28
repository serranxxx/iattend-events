"use client";

import React, { useEffect, useRef, useState } from "react";

// Lista editable sobre la pieza en el modo edición (personas, avisos…).
// Limpia, como los bloques de la portada: al pasar el mouse se marca el borde
// del renglón; el primer toque lo elige (borde fijo y "Eliminar" en rojo
// abajo) y desde ahí se arrastra libremente para reordenarlo o se vuelve a
// tocar para escribir. No hay manijas: arrastrar se deja a la intuición.
// Reordenar, borrar y agregar mandan la lista completa por `path`.
// Estilos: `.edit_row*` en src/styles/modules.css.

type Options<T> = {
  items: T[];
  path: string; // p. ej. "people.personas"
  editMode: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  makeNew: () => T;
  // Toque sobre un renglón que ya estaba elegido (sin arrastrar). Los textos
  // no lo necesitan (ese toque pone el cursor); los momentos abren su drawer.
  onActivate?: (_index: number) => void;
  // Con esto el primer toque ya activa (además de elegir).
  activateOnFirstTap?: boolean;
  // Dirección de la lista: "y" (renglones, por defecto) o "x" (p. ej. los
  // colores de la paleta del dresscode).
  axis?: "x" | "y";
};

export function useEditableList<T>({ items, path, editMode, onFieldChange, makeNew, onActivate, activateOnFirstTap = false, axis = "y" }: Options<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: number; startY: number; dy: number; to: number } | null>(null);
  const press = useRef<{ index: number; startY: number; wasSelected: boolean } | null>(null);
  // Coordenada del puntero sobre el eje de la lista.
  const at = (e: { clientX: number; clientY: number }) => (axis === "x" ? e.clientX : e.clientY);

  const commit = (next: T[]) => onFieldChange?.(path, next);
  const remove = (index: number) => { setSelected(null); commit(items.filter((_, i) => i !== index)); };
  const add = () => { commit([...items, makeNew()]); setSelected(items.length); };

  // Tocar fuera de la lista (o el tablero del editor) suelta el elegido.
  useEffect(() => {
    if (!editMode || selected === null) return;
    const onDown = (e: PointerEvent) => {
      const row = (e.target as HTMLElement | null)?.closest?.("[data-edit-row]");
      if (!row || !listRef.current?.contains(row)) setSelected(null);
    };
    const onDeselect = () => setSelected(null);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("iattend-edit-deselect", onDeselect);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("iattend-edit-deselect", onDeselect);
    };
  }, [editMode, selected]);

  const targetIndex = (pos: number) => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>(":scope > [data-edit-row]") ?? []);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      const mid = axis === "x" ? r.left + r.width / 2 : r.top + r.height / 2;
      if (pos < mid) return i;
    }
    return rows.length;
  };

  const onDown = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-edit-row-delete]")) return;
    const wasSelected = selected === index;
    press.current = { index, startY: at(e), wasSelected };
    if (!wasSelected) setSelected(index);
  };
  // El primer toque solo elige: no pone el cursor en el texto.
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (press.current && !press.current.wasSelected) e.preventDefault();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    // Se soltó fuera del renglón antes de arrastrar: no queda "presionado".
    if (!drag && e.buttons === 0) { press.current = null; return; }
    const dy = at(e) - p.startY;
    if (!drag) {
      if (Math.abs(dy) < 6) return;
      // Empieza a arrastrar: suelta el texto que se estuviera escribiendo.
      e.currentTarget.setPointerCapture(e.pointerId);
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.getSelection()?.removeAllRanges();
      setSelected(p.index);
      setDrag({ from: p.index, startY: p.startY, dy, to: targetIndex(at(e)) });
      return;
    }
    setDrag({ ...drag, dy, to: targetIndex(at(e)) });
  };
  const onUp = () => {
    const p = press.current;
    press.current = null;
    if (!drag) {
      if (p && (p.wasSelected || activateOnFirstTap)) onActivate?.(p.index);
      return;
    }
    const { from, to } = drag;
    setDrag(null);
    // `to` es la posición antes de quitar el renglón arrastrado.
    const dest = to > from ? to - 1 : to;
    if (dest === from) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(dest, 0, moved);
    commit(next);
    setSelected(dest);
  };

  // Props del renglón `index` (fuera del modo edición, nada).
  // `outlineChild`: el borde no va en el renglón sino en su hijo marcado con
  // `data-edit-card` (p. ej. la tarjeta de un momento, que ocupa medio ancho).
  const rowProps = (index: number, style?: React.CSSProperties, opts?: { outlineChild?: boolean }) => {
    if (!editMode) return { style };
    const dragging = drag?.from === index;
    return {
      "data-edit-row": true,
      "data-edit-hit": true,
      className: opts?.outlineChild ? "edit_row edit_row--child" : "edit_row",
      "data-selected": selected === index || undefined,
      "data-dragging": dragging || undefined,
      "data-drop-before": drag && !dragging && drag.to === index && drag.to !== drag.from + 1 ? true : undefined,
      onPointerDown: onDown(index),
      onMouseDown,
      onPointerMove: onMove,
      onPointerUp: onUp,
      onPointerCancel: () => { press.current = null; setDrag(null); },
      style: { ...style, position: "relative" as const, transform: dragging ? (axis === "x" ? `translateX(${drag!.dy}px)` : `translateY(${drag!.dy}px)`) : style?.transform },
    };
  };

  return {
    listRef,
    rowProps,
    // "Eliminar" va debajo del renglón elegido (no mientras se arrastra).
    showDelete: (index: number) => editMode && selected === index && !drag,
    remove,
    add,
    // Línea de "aquí cae" al final de la lista.
    dropAtEnd: Boolean(drag && drag.to === items.length && drag.from !== items.length - 1),
  };
}
