"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Bird, BringToFront, Cake, Camera, Church, CopyPlus, Ellipsis, Flower, Flower2, Gem, Heart,
  Infinity as InfinityIcon, Leaf, Lock, LockOpen, Moon, Music, SendToBack, Sparkles, Star, Sun, Trash2, Wine,
} from "lucide-react";
import type { Generals, LayerItem } from "@/types/new_invitation";
import { Separador } from "../Separator/Separator";
import { iconsItinerary } from "@/helpers/icons";
import styles from "./section-layer.module.css";
import Vector from "../../Vector/Vector";

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
// Trazo punteado / con guiones según el grosor.
const dashFor = (style: string | null | undefined, sw: number) =>
  style === "dashed" ? `${sw * 3} ${sw * 2}` : style === "dotted" ? `0 ${sw * 2}` : undefined;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Lleva un elemento al centro del contenedor con scroll más cercano (el de la
// invitación). No scrollIntoView(): ese también recorre el documento padre y
// movía el editor de iattend-vite.
const centrarEnScroll = (el?: HTMLElement | null) => {
  if (!el) return;
  let c = el.parentElement;
  while (c && !(c.scrollHeight > c.clientHeight && /(auto|scroll)/.test(getComputedStyle(c).overflowY))) c = c.parentElement;
  if (!c) return;
  const r = el.getBoundingClientRect();
  const cr = c.getBoundingClientRect();
  c.scrollTo({ top: Math.max(0, c.scrollTop + r.top - cr.top - c.clientHeight / 2 + r.height / 2), behavior: "smooth" });
};
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

export function SectionLayer({ section, items, editMode = false, accent, titleFont, bodyFont, onChange }: Props) {
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
  const [menu, setMenu] = useState<"layers" | null>(null);
  useEffect(() => { setMenu(null); }, [selected]);
  // Guías que se ven mientras se mueve (en % de la sección).
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  // Los ocultos con el ojo del panel Capas (`hidden`) se quedan guardados pero
  // no se pintan, ni en el editor ni para el invitado.
  const shown = items.filter((it) => !it.hidden).map((it) => (draft && draft.id === it.id ? draft : it));
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

  // Avisa al editor qué elemento está elegido (HostClient → REMOTE_LAYER_SELECT)
  // para su barra de propiedades.
  useEffect(() => {
    if (!editMode) return;
    window.dispatchEvent(new CustomEvent("iattend-layer-selection", { detail: { section, id: selected } }));
  }, [editMode, section, selected]);

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
      if (d?.section !== section) return;
      select(d.id);
      // Elegido desde el panel Capas del editor (o recién movido a este
      // módulo): la pieza baja hasta él y lo deja al centro.
      if (d.scroll) requestAnimationFrame(() => centrarEnScroll(itemRefs.current[d.id]));
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
    // Bloqueado: se elige pero no se mueve.
    if (it.locked) { e.stopPropagation(); return; }
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

  const renderContent = (it: LayerItem) => {
    const color = it.color || accent;
    if (it.kind === "sticker") return <img src={it.url} alt="" draggable={false} className={styles.img} />;
    if (it.kind === "icon") {
      // SVG del catálogo del editor: pintado del color del elemento (mask) o
      // tal cual si no es de un solo color.
      if (it.src && it.vector) return <Vector s={it} color={color} />;
      if (it.src) {
        return it.tint === false
          ? <img src={it.src} alt="" draggable={false} className={styles.icon} />
          : (
            <span
              className={`${styles.icon} ${styles.maskIcon}`}
              style={{ backgroundColor: color, WebkitMaskImage: `url("${it.src}")`, maskImage: `url("${it.src}")` }}
            />
          );
      }
      // "it:<n>": ícono del itinerario (react-icons) arrastrado desde Elementos.
      if (it.icon?.startsWith("it:")) {
        const ItIcon = iconsItinerary.find((x) => x.index === Number(it.icon?.slice(3)))?.value;
        if (ItIcon) return <ItIcon className={styles.icon} color={color} />;
      }
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
              border: sw > 0 ? `${sw}px ${it.strokeStyle || "solid"} ${stroke}` : "none",
              borderRadius: r >= 999 ? 9999 : `${(r / 390) * 100}cqw`,
            }}
          />
        );
      }
      return (
        <span className={styles.shape} style={{ aspectRatio: `1 / ${it.ar ?? 1}` }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
            <g fill={fill === "transparent" ? "none" : fill} stroke={sw > 0 ? stroke : "none"} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dashFor(it.strokeStyle, sw)}>
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
            style={{ ...box(it), opacity: it.opacity ?? 1, ...(it.flipX || it.flipY ? { transform: `translate(-50%, -50%) rotate(${it.rot ?? 0}deg) scale(${it.flipX ? -1 : 1}, ${it.flipY ? -1 : 1})` } : {}) }}
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
            {!current.locked && (["nw", "ne", "sw", "se"] as const).map((c) => (
              <span key={c} className={styles.handle} data-corner={c} onPointerDown={(e) => startResize(e, current)} />
            ))}
            {/* Formas: manijas en los lados para estirar sin mantener la proporción. */}
            {!current.locked && current.kind === "shape" && (["e", "w", "n", "s"] as const).map((side) => (
              <span
                key={side}
                className={styles.sideHandle}
                data-side={side}
                onPointerDown={(e) => startStretch(e, current, side)}
              />
            ))}
            {!current.locked && <span className={styles.rotate} onPointerDown={(e) => startRotate(e, current)} />}
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
            {/* Bloquear, duplicar, eliminar y capas. Color, borde, esquinas,
                voltear y transparencia van en la barra del editor, arriba de
                la pieza (iattend-vite, ElementBar), que recibe el elegido por
                REMOTE_LAYER_SELECT. */}
            <button type="button" className={styles.barBtn} title={current.locked ? "Desbloquear" : "Bloquear"} data-on={current.locked || undefined} onClick={() => replace({ ...current, locked: !current.locked })}>
              {current.locked ? <Lock size={18} /> : <LockOpen size={18} />}
            </button>
            <button type="button" className={styles.barBtn} title="Duplicar" onClick={() => duplicate(current)}>
              <CopyPlus size={18} />
            </button>
            <button type="button" className={styles.barBtn} title="Eliminar" onClick={() => remove(current)}>
              <Trash2 size={18} />
            </button>
            <button type="button" className={styles.barBtn} title="Capas" data-on={menu === "layers" || undefined} onClick={() => setMenu(menu === "layers" ? null : "layers")}>
              <Ellipsis size={18} />
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
}
