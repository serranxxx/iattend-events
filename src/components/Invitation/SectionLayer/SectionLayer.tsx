"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Bird, Blend, BringToFront, Cake, Layers, Camera, Church, Copy, Flower, Flower2, Gem, Heart,
  Infinity as InfinityIcon, Leaf, Moon, Music, PenLine, Pipette, SendToBack, Sparkles, SquareRoundCorner, Star, Sun, Trash2, Type, Wine,
} from "lucide-react";
import type { Generals, LayerItem } from "@/types/new_invitation";
import { Separador } from "../Separator/Separator";
import { loadedFontFamilies } from "@/components/GoogleFontsLoader";
import styles from "./section-layer.module.css";

// Capa de elementos sueltos de una sección (stickers, íconos, textos y
// líneas que el organizador pone desde Elementos / Stickers del editor de
// iattend-vite). El invitado solo los ve; en modo edición se eligen, se
// arrastran, se escalan (esquinas), se giran (manija de arriba) y tienen su
// barra (color, opacidad, al frente, duplicar, eliminar). Cada cambio sale
// por onChange con la lista completa (`decorations.<sección>`).
//
// Posición en % de la sección (x / y = centro, w = ancho), así se acomoda en
// cualquier pantalla. Los textos miden en cqw (ancho de la sección) para
// escalar igual que una imagen. Un elemento puede salirse de su sección y
// quedar montado entre dos (no se recorta).

// Íconos disponibles (mismos nombres que el panel Elementos de vite).
export const LAYER_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>> = {
  Heart, Sparkles, Star, Flower, Flower2, Leaf, Gem, Moon, Sun, Wine, Music, Camera, Church, Infinity: InfinityIcon, Bird, Cake,
};

// Tamaño de letra = ancho del texto × factor (en cqw).
const TEXT_FACTOR: Record<string, number> = { title: 0.16, subtitle: 0.1, body: 0.06 };

const LINE_BORDER: Record<string, string> = {
  solid: "1.5px solid",
  dashed: "1.5px dashed",
  dotted: "3px dotted",
  double: "4px double",
};

const OPACITY_STEPS = [1, 0.75, 0.5, 0.25];

// Formas básicas (kind "shape"), en una caja de ancho w y alto w × ar (así
// se deforman). Cuadrado y rectángulo son una caja con borde en px y esquinas
// redondeables (radius); círculo, triángulo y estrella, un SVG 100×100
// estirado con el trazo en px de pantalla (vector-effect en cada figura: no
// se hereda del grupo, por eso antes 6px se veía mucho más grueso).
const BOX_SHAPES = new Set(["square", "rect"]);
const NS = { vectorEffect: "non-scaling-stroke" as const };
const SHAPE_PATHS: Record<string, React.ReactNode> = {
  circle: <ellipse cx="50" cy="50" rx="50" ry="50" {...NS} />,
  triangle: <polygon points="50,0 100,100 0,100" {...NS} />,
  star: <polygon points="50,2 61,37 98,37 68,59 79,96 50,73 21,96 32,59 2,37 39,37" {...NS} />,
};
const STROKE_WIDTHS = [0, 1, 2, 3, 4];
// Esquinas de cuadrado / rectángulo, en px a 390 de ancho (se guardan así y
// se pintan en cqw para que escalen con la pantalla). 999 = píldora.
const RADII = [0, 8, 16, 24, 40, 999];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const newId = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Props = {
  section: string;
  items: LayerItem[];
  editMode?: boolean;
  accent: string;
  titleFont?: string;
  bodyFont?: string;
  // Colores del tema (generals.colors): atajos del selector de color.
  palette?: string[];
  onChange?: (_items: LayerItem[]) => void;
};

// Distancia (px) a la que un elemento se pega a una guía al moverlo.
const SNAP_PX = 6;

export function SectionLayer({ section, items, editMode = false, accent, titleFont, bodyFont, palette = [], onChange }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selected, setSelected] = useState<string | null>(null);
  // Elemento mientras se arrastra / escala / gira: se pinta así y solo se
  // guarda al soltar.
  const [draft, setDraft] = useState<LayerItem | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [frameH, setFrameH] = useState(0);
  // La barra va arriba del elegido; si ahí se sale de la pantalla, abajo.
  const [barBelow, setBarBelow] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  // La barra (y sus menús) se recorren hacia adentro si se saldrían por un
  // lado de la invitación (el contenedor recorta en horizontal).
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [barShift, setBarShift] = useState(0);
  const [menuShift, setMenuShift] = useState(0);
  // Menú abierto de la barra (tipografía o color).
  const [menu, setMenu] = useState<"font" | "color" | "stroke" | "radius" | "layers" | null>(null);
  useEffect(() => { setMenu(null); }, [selected]);
  // Guías que se ven mientras se mueve (en % de la sección).
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  const shown = items.map((it) => (draft && draft.id === it.id ? draft : it));
  const current = shown.find((it) => it.id === selected) ?? null;

  const commit = (next: LayerItem[]) => onChange?.(next);
  const replace = (item: LayerItem) => commit(items.map((it) => (it.id === item.id ? item : it)));

  // Texto que se está escribiendo: se guarda al salir por cualquier lado
  // (blur, tocar fuera, Escape, el tablero del editor). Tocar fuera desmonta
  // el campo y el navegador no siempre manda blur.
  const editableRef = useRef<HTMLElement | null>(null);
  const finishText = () => {
    const el = editableRef.current;
    const it = items.find((x) => x.id === editingText);
    editableRef.current = null;
    setEditingText(null);
    if (!el || !it) return;
    const text = el.innerText.replace(/\n+$/, "");
    if (text !== it.text) replace({ ...it, text });
  };

  const select = (id: string | null) => {
    setSelected(id);
    if (id) window.dispatchEvent(new CustomEvent("iattend-layer-selected", { detail: { section } }));
  };

  // Alto real del elegido (para el marco y la barra).
  useLayoutEffect(() => {
    if (!selected) return;
    const h = itemRefs.current[selected]?.offsetHeight ?? 0;
    if (h !== frameH) setFrameH(h);
    const top = frameRef.current?.getBoundingClientRect().top;
    const below = top !== undefined && top - 90 < 0;
    if (below !== barBelow) setBarBelow(below);
    const fit = (el: HTMLElement | null, shift: number) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const left = r.left - shift;
      const right = r.right - shift;
      const max = document.documentElement.clientWidth - 8;
      if (left < 8) return 8 - left;
      if (right > max) return max - right;
      return 0;
    };
    const bs = Math.round(fit(barRef.current, barShift));
    if (bs !== barShift) setBarShift(bs);
    const ms = Math.round(fit(menuRef.current, menuShift));
    if (ms !== menuShift) setMenuShift(ms);
  });

  // Al hacer scroll se vuelve a medir (la barra puede cambiar de lado).
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!selected) return;
    const onScroll = () => setTick((n) => n + 1);
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [selected]);

  // Elegir uno aquí suelta el de las otras secciones; el editor también
  // puede pedir elegir uno recién soltado (HostClient).
  useEffect(() => {
    if (!editMode) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail?.section !== section) setSelected(null);
    };
    const onPick = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.section === section) select(d.id);
    };
    const onDeselect = () => { finishText(); setSelected(null); };
    window.addEventListener("iattend-layer-selected", onOther);
    window.addEventListener("iattend-layer-select", onPick);
    window.addEventListener("iattend-edit-deselect", onDeselect);
    return () => {
      window.removeEventListener("iattend-layer-selected", onOther);
      window.removeEventListener("iattend-layer-select", onPick);
      window.removeEventListener("iattend-edit-deselect", onDeselect);
    };
  }, [editMode, section, editingText, items]);

  // Tocar fuera (otra parte de la pieza) lo suelta.
  useEffect(() => {
    if (!editMode || (!selected && !editingText)) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(`[data-layer-section="${section}"] [data-layer-keep]`)) return;
      finishText();
      setSelected(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [editMode, selected, section, editingText, items]);

  // Teclado: suprimir, Escape y flechas (Shift = paso grande).
  useEffect(() => {
    if (!editMode || !selected || editingText) return;
    const onKey = (e: KeyboardEvent) => {
      const it = items.find((x) => x.id === selected);
      if (!it) return;
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        commit(items.filter((x) => x.id !== selected));
        setSelected(null);
      } else if (e.key === "Escape") {
        setSelected(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.5;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        replace({ ...it, x: it.x + dx, y: it.y + dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Gesto genérico: sigue al puntero y guarda al soltar (si se movió).
  const track = (e: React.PointerEvent, it: LayerItem, next: (_ev: PointerEvent, _rect: DOMRect) => LayerItem | null, onTap?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    let last: LayerItem = it;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      moved = true;
      const n = next(ev, rect);
      if (n) { last = n; setDraft(n); }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraft(null);
      setGuides({ x: [], y: [] });
      if (moved) replace(last);
      else onTap?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startMove = (e: React.PointerEvent, it: LayerItem) => {
    if (!editMode || editingText === it.id || e.button !== 0) return;
    select(it.id);
    const sx = e.clientX;
    const sy = e.clientY;
    // Guías: el centro de la sección y el centro de los demás elementos.
    const others = items.filter((o) => o.id !== it.id);
    const linesX = [50, ...others.map((o) => o.x)];
    const linesY = [50, ...others.map((o) => o.y)];
    const snap = (value: number, lines: number[], size: number) => {
      const tol = (SNAP_PX / size) * 100;
      let best: number | null = null;
      lines.forEach((l) => { if (Math.abs(l - value) <= tol && (best === null || Math.abs(l - value) < Math.abs(best - value))) best = l; });
      return best;
    };
    track(e, it, (ev, rect) => {
      // Puede salirse de su sección (quedar entre dos), no de la invitación.
      let x = clamp(it.x + ((ev.clientX - sx) / rect.width) * 100, -10, 110);
      let y = clamp(it.y + ((ev.clientY - sy) / rect.height) * 100, -100, 200);
      const gx = snap(x, linesX, rect.width);
      const gy = snap(y, linesY, rect.height);
      if (gx !== null) x = gx;
      if (gy !== null) y = gy;
      setGuides({ x: gx !== null ? [gx] : [], y: gy !== null ? [gy] : [] });
      return { ...it, x, y };
    });
  };

  const center = (it: LayerItem, rect: DOMRect) => ({ cx: rect.left + (it.x / 100) * rect.width, cy: rect.top + (it.y / 100) * rect.height });

  const startResize = (e: React.PointerEvent, it: LayerItem) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { cx, cy } = center(it, rect);
    const d0 = Math.max(4, Math.hypot(e.clientX - cx, e.clientY - cy));
    track(e, it, (ev) => ({ ...it, w: clamp(it.w * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0), 3, 160) }));
  };

  // Estirar una forma por un lado (sin mantener la proporción): "x" cambia el
  // ancho conservando el alto; "y" cambia solo el alto (ar).
  // El lado contrario se queda fijo: crece solo hacia donde se jala (también
  // girada: se mide sobre los ejes propios de la forma).
  const startStretch = (e: React.PointerEvent, it: LayerItem, side: "e" | "w" | "n" | "s") => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { cx, cy } = center(it, rect);
    const rad = ((it.rot ?? 0) * Math.PI) / 180;
    const ux = { x: Math.cos(rad), y: Math.sin(rad) };   // eje del ancho
    const uy = { x: -Math.sin(rad), y: Math.cos(rad) };  // eje del alto
    const w0 = (it.w / 100) * rect.width;
    const h0 = w0 * (it.ar ?? 1);
    const horizontal = side === "e" || side === "w";
    const axis = horizontal ? ux : uy;
    const sign = side === "e" || side === "s" ? 1 : -1;
    const size0 = horizontal ? w0 : h0;
    // Punto fijo: el centro del lado contrario.
    const ax = cx - sign * axis.x * (size0 / 2);
    const ay = cy - sign * axis.y * (size0 / 2);
    const sx = e.clientX;
    const sy = e.clientY;
    track(e, it, (ev) => {
      const along = (ev.clientX - sx) * axis.x + (ev.clientY - sy) * axis.y;
      const size = Math.max(8, size0 + sign * along);
      const ncx = ax + sign * axis.x * (size / 2);
      const ncy = ay + sign * axis.y * (size / 2);
      const w = horizontal ? size : w0;
      const h = horizontal ? h0 : size;
      return {
        ...it,
        x: ((ncx - rect.left) / rect.width) * 100,
        y: ((ncy - rect.top) / rect.height) * 100,
        w: clamp((w / rect.width) * 100, 1, 160),
        ar: clamp(h / w, 0.02, 50),
      };
    });
  };

  const startRotate = (e: React.PointerEvent, it: LayerItem) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { cx, cy } = center(it, rect);
    track(e, it, (ev) => {
      let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      deg = ((deg % 360) + 360) % 360;
      // Se pega a 0 / 90 / 180 / 270 cuando pasa cerca.
      const snap = Math.round(deg / 90) * 90;
      if (Math.abs(deg - snap) < 4) deg = snap % 360;
      return { ...it, rot: Math.round(deg) };
    });
  };

  const duplicate = (it: LayerItem) => {
    const copy = { ...it, id: newId(), x: clamp(it.x + 5, 0, 100), y: clamp(it.y + 5, 0, 100) };
    commit([...items, copy]);
    select(copy.id);
  };
  // Capas. Dos planos: detrás del contenido del bloque (z "back") y delante
  // (el de siempre); dentro de cada plano manda el orden de la lista.
  const plane = (x: LayerItem) => (x.z === "back" ? 0 : 1);
  const ordered = (list: LayerItem[]) => [...list].sort((a, b) => plane(a) - plane(b));
  const layerMove = (it: LayerItem, to: "front" | "up" | "down" | "back") => {
    const rest = items.filter((x) => x.id !== it.id);
    if (to === "front") return commit(ordered([...rest, { ...it, z: "front" }]));
    if (to === "back") return commit(ordered([{ ...it, z: "back" }, ...rest]));
    // Un paso: cambia de lugar con el vecino; en la orilla de su plano, pasa
    // al otro plano.
    const list = ordered(items);
    const i = list.findIndex((x) => x.id === it.id);
    const j = to === "up" ? i + 1 : i - 1;
    if (j < 0 || j >= list.length || plane(list[j]) !== plane(it)) {
      const z = to === "up" ? "front" : "back";
      if ((to === "up" && it.z !== "back") || (to === "down" && it.z === "back")) return;
      const moved = { ...it, z } as LayerItem;
      return commit(ordered(to === "up" ? [moved, ...rest] : [...rest, moved]));
    }
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const remove = (it: LayerItem) => { commit(items.filter((x) => x.id !== it.id)); setSelected(null); };
  const nextOpacity = (it: LayerItem) => {
    const i = OPACITY_STEPS.findIndex((o) => Math.abs(o - (it.opacity ?? 1)) < 0.01);
    replace({ ...it, opacity: OPACITY_STEPS[(i + 1) % OPACITY_STEPS.length] });
  };

  const renderContent = (it: LayerItem) => {
    const color = it.color || accent;
    if (it.kind === "sticker") return <img src={it.url} alt="" draggable={false} className={styles.img} />;
    if (it.kind === "icon") {
      const Icon = LAYER_ICONS[it.icon ?? ""] ?? Heart;
      return <Icon className={styles.icon} color={color} strokeWidth={1.6} />;
    }
    if (it.kind === "shape") {
      const sw = it.strokeWidth ?? 0;
      const fill = it.color === "transparent" ? "transparent" : it.color || accent;
      const stroke = it.stroke || accent;
      if (BOX_SHAPES.has(it.variant ?? "square")) {
        const r = it.radius ?? 0;
        return (
          <span
            className={styles.shapeBox}
            style={{
              aspectRatio: `1 / ${it.ar ?? 1}`,
              background: fill,
              border: sw > 0 ? `${sw}px solid ${stroke}` : "none",
              borderRadius: r >= 999 ? 9999 : `${(r / 390) * 100}cqw`,
            }}
          />
        );
      }
      return (
        <span className={styles.shape} style={{ aspectRatio: `1 / ${it.ar ?? 1}` }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
            <g fill={fill === "transparent" ? "none" : fill} stroke={sw > 0 ? stroke : "none"} strokeWidth={sw} strokeLinejoin="round">
              {SHAPE_PATHS[it.variant ?? "circle"] ?? SHAPE_PATHS.circle}
            </g>
          </svg>
        </span>
      );
    }
    if (it.kind === "separator") {
      // Los mismos adornos de la invitación, en el color del elemento.
      return (
        <span className={styles.separator}>
          <Separador value={Number(it.variant) || 1} generals={{ colors: { accent: color } } as unknown as Generals} />
        </span>
      );
    }
    if (it.kind === "line") return <span className={styles.line} style={{ borderTop: `${LINE_BORDER[it.variant ?? "solid"] ?? LINE_BORDER.solid} ${color}` }} />;
    const variant = it.variant ?? "body";
    const textStyle: React.CSSProperties = {
      color,
      fontFamily: it.font || (variant === "title" ? titleFont : bodyFont),
      fontWeight: variant === "title" ? 600 : variant === "subtitle" ? 500 : 400,
      fontSize: `${it.w * (TEXT_FACTOR[variant] ?? 0.06)}cqw`,
    };
    if (editingText === it.id) {
      return (
        <span
          className={styles.text}
          style={textStyle}
          contentEditable
          suppressContentEditableWarning
          ref={(el) => {
            editableRef.current = el;
            if (el && document.activeElement !== el) {
              el.focus();
              const r = document.createRange();
              r.selectNodeContents(el);
              const s = window.getSelection();
              s?.removeAllRanges();
              s?.addRange(r);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === "Escape") (e.target as HTMLElement).blur(); }}
          onBlur={finishText}
        >
          {it.text}
        </span>
      );
    }
    return <span className={styles.text} style={textStyle}>{it.text}</span>;
  };

  const box = (it: LayerItem): React.CSSProperties => ({
    left: `${it.x}%`,
    top: `${it.y}%`,
    width: `${it.w}%`,
    transform: `translate(-50%, -50%) rotate(${it.rot ?? 0}deg)`,
  });

  return (
    <div ref={layerRef} className={styles.layer} data-layer data-layer-section={section} data-edit={editMode || undefined} data-active={(editMode && current) || undefined}>
      {(["back", "front"] as const).map((planeName) => (
      <div key={planeName} className={planeName === "back" ? styles.clipBack : styles.clip}>
        {shown.filter((it) => (it.z === "back" ? "back" : "front") === planeName).map((it) => (
          <div
            key={it.id}
            ref={(el) => { itemRefs.current[it.id] = el; }}
            className={styles.item}
            data-kind={it.kind}
            data-layer-keep
            style={{ ...box(it), opacity: it.opacity ?? 1 }}
            onPointerDown={(e) => startMove(e, it)}
            onDoubleClick={() => { if (editMode && it.kind === "text") { select(it.id); setEditingText(it.id); } }}
          >
            {renderContent(it)}
          </div>
        ))}
      </div>
      ))}

      {editMode && (guides.x.length > 0 || guides.y.length > 0) && (
        <div className={styles.guides}>
          {guides.x.map((g) => <span key={`x${g}`} className={styles.guideV} style={{ left: `${g}%` }} />)}
          {guides.y.map((g) => <span key={`y${g}`} className={styles.guideH} style={{ top: `${g}%` }} />)}
        </div>
      )}

      {editMode && current && (
        <div className={styles.chrome}>
          <div ref={frameRef} className={styles.frame} data-layer-keep style={{ ...box(current), height: frameH }}>
            {(["nw", "ne", "sw", "se"] as const).map((c) => (
              <span key={c} className={styles.handle} data-corner={c} onPointerDown={(e) => startResize(e, current)} />
            ))}
            {/* Formas: manijas en los lados para estirar sin mantener la proporción. */}
            {current.kind === "shape" && (["e", "w", "n", "s"] as const).map((side) => (
              <span
                key={side}
                className={styles.sideHandle}
                data-side={side}
                onPointerDown={(e) => startStretch(e, current, side)}
              />
            ))}
            <span className={styles.rotate} onPointerDown={(e) => startRotate(e, current)} />
          </div>

          <div
            ref={barRef}
            className={styles.bar}
            data-layer-keep
            data-below={barBelow || undefined}
            // Arriba deja libre la manija de giro; si no cabe arriba, va abajo.
            style={{ left: `${current.x}%`, top: barBelow ? `calc(${current.y}% + ${frameH / 2 + 14}px)` : `calc(${current.y}% - ${frameH / 2 + 46}px)`, marginLeft: barShift }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {current.kind !== "sticker" && (
              <button type="button" className={styles.barBtn} title={current.kind === "shape" ? "Relleno" : "Color"} data-on={menu === "color" || undefined} onClick={() => setMenu(menu === "color" ? null : "color")}>
                <span className={styles.swatch} data-empty={current.color === "transparent" || undefined} style={{ background: current.color === "transparent" ? undefined : current.color || accent }} />
              </button>
            )}
            {current.kind === "shape" && BOX_SHAPES.has(current.variant ?? "square") && (
              <button type="button" className={styles.barBtn} title="Esquinas" data-on={menu === "radius" || undefined} onClick={() => setMenu(menu === "radius" ? null : "radius")}>
                <SquareRoundCorner size={15} />
              </button>
            )}
            {current.kind === "shape" && (
              <button type="button" className={styles.barBtn} title="Borde" data-on={menu === "stroke" || undefined} onClick={() => setMenu(menu === "stroke" ? null : "stroke")}>
                <span className={styles.swatchRing} style={{ borderColor: (current.strokeWidth ?? 0) > 0 ? current.stroke || accent : "rgba(255,255,255,0.35)" }} />
              </button>
            )}
            {current.kind === "text" && (
              <button type="button" className={styles.barBtn} title="Tipografía" data-on={menu === "font" || undefined} onClick={() => setMenu(menu === "font" ? null : "font")}>
                <Type size={15} />
              </button>
            )}
            {current.kind === "text" && (
              <button type="button" className={styles.barBtn} title="Editar texto" onClick={() => setEditingText(current.id)}>
                <PenLine size={15} />
              </button>
            )}
            <button type="button" className={styles.barBtn} title="Opacidad" onClick={() => nextOpacity(current)}>
              <Blend size={15} />
              <span className={styles.barValue}>{Math.round((current.opacity ?? 1) * 100)}</span>
            </button>
            <button type="button" className={styles.barBtn} title="Capas" data-on={menu === "layers" || undefined} onClick={() => setMenu(menu === "layers" ? null : "layers")}>
              <Layers size={15} />
            </button>
            <button type="button" className={styles.barBtn} title="Duplicar" onClick={() => duplicate(current)}>
              <Copy size={15} />
            </button>
            <span className={styles.barDivider} />
            <button type="button" className={`${styles.barBtn} ${styles.barDanger}`} title="Eliminar" onClick={() => remove(current)}>
              <Trash2 size={15} />
            </button>

            {(menu === "color" || menu === "stroke") && (() => {
              // Mismo menú para el color / relleno y para el borde de las formas.
              const key = menu === "stroke" ? "stroke" : "color";
              const value = (current[key] as string | null | undefined) || accent;
              const set = (c: string) => replace(menu === "stroke"
                ? { ...current, stroke: c, strokeWidth: (current.strokeWidth ?? 0) > 0 ? current.strokeWidth : 2 }
                : { ...current, color: c });
              return (
                <div ref={menuRef} className={styles.menu} data-below={barBelow || undefined} style={{ marginLeft: menuShift }}>
                  <span className={styles.menuLabel}>Tu paleta</span>
                  <div className={styles.menuSwatches}>
                    {current.kind === "shape" && menu === "color" && (
                      <button
                        type="button"
                        className={styles.menuSwatch}
                        data-empty
                        data-on={current.color === "transparent" || undefined}
                        title="Sin relleno"
                        onClick={() => replace({ ...current, color: "transparent" })}
                      />
                    )}
                    {[...new Set(palette.filter(Boolean))].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={styles.menuSwatch}
                        data-on={value.toLowerCase() === c.toLowerCase() || undefined}
                        style={{ background: c }}
                        title={c}
                        onClick={() => set(c)}
                      />
                    ))}
                    <label className={styles.menuSwatch} data-custom title="Otro color">
                      <Pipette size={13} />
                      <input type="color" className={styles.colorInput} value={value === "transparent" ? accent : value} onChange={(e) => set(e.target.value)} />
                    </label>
                  </div>
                  {menu === "stroke" && (
                    <>
                      <span className={styles.menuLabel}>Grosor</span>
                      <div className={styles.menuChips}>
                        {STROKE_WIDTHS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            className={styles.menuChip}
                            data-on={(current.strokeWidth ?? 0) === w || undefined}
                            onClick={() => replace({ ...current, strokeWidth: w })}
                          >
                            {w === 0 ? "Sin" : `${w}px`}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {menu === "layers" && (
              <div ref={menuRef} className={`${styles.menu} ${styles.layerMenu}`} data-below={barBelow || undefined} style={{ marginLeft: menuShift }}>
                <button type="button" className={styles.layerOption} onClick={() => layerMove(current, "front")}>
                  <BringToFront size={15} /> Al frente
                </button>
                <button type="button" className={styles.layerOption} onClick={() => layerMove(current, "up")}>
                  <ArrowUp size={15} /> Subir
                </button>
                <button type="button" className={styles.layerOption} onClick={() => layerMove(current, "down")}>
                  <ArrowDown size={15} /> Bajar
                </button>
                <button type="button" className={styles.layerOption} data-on={current.z === "back" || undefined} onClick={() => layerMove(current, "back")}>
                  <SendToBack size={15} /> Detrás del contenido
                </button>
              </div>
            )}

            {menu === "radius" && (
              <div ref={menuRef} className={styles.menu} data-below={barBelow || undefined} style={{ marginLeft: menuShift }}>
                <span className={styles.menuLabel}>Esquinas</span>
                <div className={styles.menuChips}>
                  {RADII.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={styles.menuChip}
                      data-on={(current.radius ?? 0) === r || undefined}
                      onClick={() => replace({ ...current, radius: r })}
                    >
                      {r === 0 ? "Rectas" : r >= 999 ? "Píldora" : r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {menu === "font" && (
              <div ref={menuRef} className={`${styles.menu} ${styles.fontMenu}`} data-below={barBelow || undefined} style={{ marginLeft: menuShift }}>
                {[{ label: "Del tema", value: null as string | null }, ...loadedFontFamilies().map((f) => ({ label: f, value: f as string | null }))].map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    className={styles.fontOption}
                    data-on={(current.font ?? null) === f.value || undefined}
                    style={{ fontFamily: f.value ? `"${f.value}"` : (current.variant === "title" ? titleFont : bodyFont) }}
                    onClick={() => { replace({ ...current, font: f.value }); setMenu(null); }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
