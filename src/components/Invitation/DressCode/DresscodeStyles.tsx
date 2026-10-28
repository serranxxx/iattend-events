"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Pin, X } from "lucide-react";

// Catálogo del Dress code (handoff "Dresscode Catálogo"). Título y
// descripción no cambian; los tres elementos opcionales tienen cada uno su
// estilo:
//   Paleta   dresscode.palette_style  "P1" … "P6"  (vacío = P1, la de siempre)
//   Imágenes dresscode.images_style   "I1" … "I5"  (vacío = I1, el carrusel)
//   Botón    dresscode.button_style   "B1" | "B2" | "B3" | "B4" | "B6" (vacío = B1)
// P1 / I1 / B1 los pinta DressCode.tsx como siempre; aquí van los demás.
// Nombres de color en dresscode.color_names (mismo orden que colors; sin
// nombre se pone uno aproximado, nunca el código) y texto del botón en
// dresscode.button_label (vacío = el de siempre).
//
// `fg`: el color de los textos del bloque (el de la descripción).

export const PALETTE_STYLES = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;
export const IMAGE_STYLES = ["I1", "I2", "I3", "I4", "I5"] as const;
export const BUTTON_STYLES = ["B1", "B2", "B3", "B4", "B6"] as const;

export const pickStyle = <T extends readonly string[]>(list: T, value: string | null | undefined): T[number] =>
  (list as readonly string[]).includes(value ?? "") ? (value as T[number]) : list[0];

const EASE = "cubic-bezier(.2,.8,.2,1)";

// Nombre aproximado de un color (cuando no tiene uno escrito): nunca se
// muestra el código. Espejo de guessColorName en iattend-vite (colorUtils.js).
export function guessColorName(hex: string): string {
  const m = /^#?([0-9a-f]{6})/i.exec(hex ?? "");
  if (!m) return "";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (l < 0.19) return "Negro";
  if (l > 0.975) return "Blanco";
  if (sat < 0.14) return l > 0.85 ? "Marfil" : l > 0.6 ? "Gris perla" : l > 0.35 ? "Gris" : "Gris oxford";
  if (h >= 20 && h < 55 && sat < 0.5) return l > 0.82 ? "Marfil" : l > 0.55 ? "Arena" : l > 0.35 ? "Camel" : "Café";
  if (h < 12 || h >= 345) return l > 0.75 ? "Rosa" : l < 0.32 ? "Vino" : "Rojo";
  if (h < 40) return l < 0.4 ? "Café" : l > 0.75 ? "Durazno" : "Terracota";
  if (h < 65) return l < 0.45 ? "Mostaza" : l > 0.8 ? "Crema" : "Amarillo";
  if (h < 165) return sat < 0.35 ? (l > 0.55 ? "Salvia" : "Oliva") : l < 0.3 ? "Verde bosque" : l > 0.75 ? "Verde menta" : "Verde";
  if (h < 200) return l > 0.75 ? "Aqua" : "Turquesa";
  if (h < 250) return l < 0.3 ? "Azul marino" : l > 0.72 ? "Azul cielo" : "Azul";
  if (h < 290) return l > 0.72 ? "Lila" : "Morado";
  return l < 0.32 ? "Vino" : l > 0.75 ? "Rosa palo" : "Rosa";
}

// ── Paleta ──
export function StyledPalette({ style, colors, names, fg, sans, serif, lead, onClick }: {
  style: Exclude<(typeof PALETTE_STYLES)[number], "P1">;
  colors: string[];
  names: (string | null | undefined)[];
  fg: string;
  sans: string;
  serif: string;
  lead?: string; // "Viste en" (P6)
  onClick?: (_e: React.MouseEvent<HTMLElement>) => void;
}) {
  // Su nombre escrito o, si no tiene, uno aproximado (nunca el código).
  const name = (i: number) => names?.[i]?.trim() || guessColorName(colors[i]);
  const two = colors.length > 4;
  const label = (i: number) => `${name(i)} ${colors[i]}`;
  const wrap = (node: React.ReactNode) => (
    <div data-edit-hit={onClick ? true : undefined} onClick={onClick} style={{ display: "flex", justifyContent: "center", width: "100%", cursor: onClick ? "pointer" : undefined, color: fg }}>
      {node}
    </div>
  );
  switch (style) {
    case "P2":
      return wrap(
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${two ? Math.ceil(colors.length / 2) : colors.length}, auto)`, justifyContent: "center", gap: "16px 22px" }}>
          {colors.map((c, i) => (
            <div key={i} aria-label={label(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ width: 56, height: 56, borderRadius: "50%", background: c, boxShadow: "0 0 0 1px rgba(255,255,255,.5)" }} />
              {name(i) && <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500 }}>{name(i)}</span>}
            </div>
          ))}
        </div>
      );
    case "P3":
      return wrap(
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 270, maxWidth: "100%" }}>
          <div style={{ width: "100%", height: 44, borderRadius: 99, overflow: "hidden", display: "flex", boxShadow: "0 0 0 3px rgba(255,255,255,.85)" }}>
            {colors.map((c, i) => <span key={i} aria-label={label(i)} style={{ flex: 1, background: c }} />)}
          </div>
          {(
            <div style={{ width: "100%", display: "flex" }}>
              {colors.map((_, i) => <span key={i} style={{ flex: 1, minWidth: 0, textAlign: "center", fontFamily: sans, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(i)}</span>)}
            </div>
          )}
        </div>
      );
    case "P4":
      return wrap(
        // Hasta 3 a su tamaño; con más, un poco más chicas para que quepan 4
        // por fila (5–6 pasan a dos filas).
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: colors.length > 3 ? 10 : 14, padding: "6px 0", maxWidth: colors.length > 3 ? 300 : undefined }}>
          {colors.map((c, i) => (
            <div key={i} aria-label={label(i)} style={{ width: colors.length > 3 ? 62 : 74, height: colors.length > 3 ? 88 : 104, borderRadius: 6, background: "#FFFFFF", padding: 5, display: "flex", flexDirection: "column", gap: 5, transform: `rotate(${[-6, 2, 7, -3, 5, -5][i % 6]}deg)`, boxShadow: "0 6px 14px rgba(0,0,0,.18)", boxSizing: "border-box" }}>
              <div style={{ flex: 1, borderRadius: 3, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)", display: "flex", justifyContent: "center", paddingTop: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF", boxShadow: "inset 0 1px 2px rgba(0,0,0,.3)" }} />
              </div>
              <span style={{ textAlign: "center", fontFamily: serif, fontSize: 12.5, fontWeight: 600, color: "#29262D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minHeight: 15 }}>{name(i)}</span>
            </div>
          ))}
        </div>
      );
    case "P5":
      return wrap(
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${two ? Math.ceil(colors.length / 2) : colors.length}, minmax(0, 86px))`, background: "#FFFFFF", borderRadius: 14, padding: 6, gap: 4, boxShadow: "0 8px 18px rgba(0,0,0,.15)" }}>
          {colors.map((c, i) => (
            <div key={i} aria-label={label(i)} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ height: 76, borderRadius: 9, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)" }} />
              <span style={{ padding: "0 4px 4px", fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: "#1B1B1B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minHeight: 14 }}>{name(i)}</span>
            </div>
          ))}
        </div>
      );
    case "P6":
      return wrap(
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20 }}>{lead ?? "Viste en"}</span>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px" }}>
            {colors.map((c, i) => (
              <span key={i} aria-label={label(i)} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: sans, fontSize: 15, fontWeight: 500 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: c, boxShadow: "0 0 0 1.5px #FFFFFF" }} />{name(i)}
              </span>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ── Visor a pantalla completa (swipe con scroll-snap) ──
function Viewer({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = start * el.clientWidth;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, onClose]);
  return createPortal(
    <div role="dialog" aria-modal onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.92)" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0, display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
        {images.map((src, i) => (
          <div key={i} style={{ flex: "none", width: "100%", height: "100%", scrollSnapAlign: "center", display: "grid", placeItems: "center", padding: 16, boxSizing: "border-box" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }} />
          </div>
        ))}
      </div>
      <button type="button" aria-label="Cerrar" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", color: "#FFFFFF", display: "grid", placeItems: "center", cursor: "pointer" }}>
        <X size={20} />
      </button>
    </div>,
    document.body,
  );
}

const Photo = ({ src, style, onClick }: { src: string; style?: React.CSSProperties; onClick?: () => void }) => (
  <div
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    onClick={onClick}
    style={{ overflow: "hidden", backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center", cursor: onClick ? "zoom-in" : undefined, ...style }}
  />
);

// ── Imágenes ──
export function StyledImages({ style, images, fg, serif, editMode }: {
  style: Exclude<(typeof IMAGE_STYLES)[number], "I1">;
  images: string[];
  fg: string;
  serif: string;
  editMode?: boolean;
}) {
  const [view, setView] = useState<number | null>(null);
  const [deck, setDeck] = useState(0);
  const n = images.length;
  useEffect(() => { if (deck >= n) setDeck(0); }, [n]);
  // En el editor tocarlas abre su barra (el contenedor de DressCode), no el visor.
  const open = (i: number) => (editMode ? undefined : () => setView(i));
  const viewer = view !== null && <Viewer images={images} start={view} onClose={() => setView(null)} />;

  switch (style) {
    case "I2": {
      const [a, b, c] = images;
      return (
        <div style={{ width: "100%" }}>
          {n >= 3 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gridTemplateRows: "150px 150px", gap: 8 }}>
              <Photo src={a} onClick={open(0)} style={{ gridRow: "span 2", borderRadius: 18 }} />
              <Photo src={b} onClick={open(1)} style={{ borderRadius: 18 }} />
              <Photo src={c} onClick={open(2)} style={{ borderRadius: 18 }} />
            </div>
          ) : n === 2 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, height: 308 }}>
              <Photo src={a} onClick={open(0)} style={{ borderRadius: 18 }} />
              <Photo src={b} onClick={open(1)} style={{ borderRadius: 18 }} />
            </div>
          ) : (
            <Photo src={a} onClick={open(0)} style={{ height: 308, borderRadius: 18 }} />
          )}
          {viewer}
        </div>
      );
    }
    case "I3": {
      // Polaroids sin texto: el marco blanco con su franja de abajo.
      const shown = images.slice(0, 3);
      const POS = [{ x: -110, y: 24, r: -7, z: 1 }, { x: 0, y: 0, r: 2, z: 3 }, { x: 110, y: 28, r: 8, z: 2 }];
      const place = shown.length === 1 ? [POS[1]] : shown.length === 2 ? [{ ...POS[0], x: -58 }, { ...POS[2], x: 58 }] : POS;
      return (
        <div style={{ position: "relative", width: "100%", height: 230 }}>
          {shown.map((src, i) => (
            <div key={i} style={{ position: "absolute", left: "50%", top: 8 + place[i].y, width: 124, marginLeft: -62 + place[i].x, background: "#FFFFFF", padding: "7px 7px 26px", transform: `rotate(${place[i].r}deg)`, boxShadow: "0 10px 20px rgba(0,0,0,.2)", zIndex: place[i].z, boxSizing: "border-box" }}>
              <Photo src={src} onClick={open(i)} style={{ height: 150 }} />
            </div>
          ))}
          {viewer}
        </div>
      );
    }
    case "I4": {
      const shown = images.slice(0, 4);
      const extra = n - 4;
      return (
        <div style={{ width: "100%", padding: "0 4px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {shown.map((src, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 16, overflow: "hidden" }}>
              <Photo src={src} onClick={open(i)} style={{ position: "absolute", inset: 0 }} />
              {i === 3 && extra > 0 && (
                <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", color: "#FFFFFF", display: "grid", placeItems: "center", fontFamily: serif, fontSize: 30, fontWeight: 600, pointerEvents: "none" }}>+{extra}</span>
              )}
            </div>
          ))}
          {viewer}
        </div>
      );
    }
    case "I5": {
      const cur = Math.min(deck, n - 1);
      const next = () => setDeck((k) => (k + 1) % n);
      return (
        <div style={{ position: "relative", width: "100%", height: 360 }}>
          {images.map((src, i) => {
            const pos = (i - cur + n) % n;
            return (
              <div
                key={i}
                role={pos === 0 && !editMode ? "button" : undefined}
                tabIndex={pos === 0 && !editMode ? 0 : undefined}
                aria-label="Siguiente foto"
                onKeyDown={(e) => { if (!editMode && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); } }}
                onClick={editMode ? undefined : next}
                style={{ position: "absolute", left: "50%", top: 6, width: 230, height: 300, marginLeft: -115, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 22px rgba(0,0,0,.2)", zIndex: n - pos, opacity: pos > 2 ? 0 : 1, transform: `translate(${pos * 10}px, ${pos * 8}px) rotate(${[0, 4, -4][pos] ?? 0}deg)`, transition: `transform .5s ${EASE}, opacity .4s`, cursor: editMode ? undefined : "pointer", backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
            );
          })}
          {n > 1 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex", justifyContent: "center", gap: 6 }}>
              {images.map((_, i) => <span key={i} style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 99, background: i === cur ? fg : `color-mix(in srgb, ${fg} 35%, transparent)`, transition: "width .3s" }} />)}
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

// ── Botón de Pinterest ──
export function StyledPinButton({ style, href, label, fg, sans, serif, editMode, onEdit }: {
  style: Exclude<(typeof BUTTON_STYLES)[number], "B1">;
  href: string;
  label: string;
  fg: string;
  sans: string;
  serif: string;
  editMode?: boolean;
  onEdit?: (_e: React.MouseEvent<HTMLElement>) => void;
}) {
  const [hover, setHover] = useState(false);
  const lift: React.CSSProperties = hover ? { transform: "translateY(-1px)", boxShadow: "0 6px 14px rgba(0,0,0,.15)" } : {};
  const common = {
    href: editMode ? undefined : href,
    target: "_blank",
    rel: "noopener noreferrer",
    "data-edit-hit": editMode || undefined,
    onClick: editMode ? (e: React.MouseEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); onEdit?.(e); } : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
  const pill: React.CSSProperties = { height: 46, padding: "0 22px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 10, fontFamily: sans, fontSize: 15.5, textDecoration: "none", cursor: "pointer", transition: "transform .2s, box-shadow .2s", boxSizing: "border-box" };
  switch (style) {
    case "B2":
      return <a {...common} style={{ ...pill, background: "#E60023", color: "#FFFFFF", fontWeight: 600, ...lift }}><Pin size={18} />{label}</a>;
    case "B3":
      return <a {...common} style={{ ...pill, border: `1.5px solid ${fg}`, background: "transparent", color: fg, fontWeight: 500, ...lift }}><Pin size={18} />{label}</a>;
    case "B4":
      return (
        <a {...common} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: serif, fontStyle: "italic", fontSize: 20, color: fg, textDecoration: "none", borderBottom: `1px solid ${fg}`, paddingBottom: 2, cursor: "pointer" }}>
          {label}<ArrowUpRight size={18} />
        </a>
      );
    case "B6":
      return (
        <a {...common} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none", color: fg, cursor: "pointer" }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "#FFFFFF", color: "#1B1B1B", display: "grid", placeItems: "center", transition: "transform .2s, box-shadow .2s", ...lift }}><Pin size={20} /></span>
          <span style={{ fontFamily: sans, fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        </a>
      );
    default:
      return null;
  }
}
