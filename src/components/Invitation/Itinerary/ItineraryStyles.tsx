"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Address, ItineraryItem } from "@/types/new_invitation";
import { isGlyphIcon, isImageIcon, SEPARADOR_COLOR } from "@/helpers/icons";
import { esUrlDeVector } from "@/helpers/vector";

// Catálogo de estilos del itinerario (handoff "Itinerario Catálogo"). El
// estilo vive en itinerary.style; "1a" (o vacío) es el zigzag de siempre y
// lo pinta Card.tsx tal cual. Aquí van 1b … 1l con los mismos datos y las
// mismas acciones del editor (Card pasa `row`, `iconSlot`, `onOpen`…).
//
// Sin fondo propio (el bloque ya tiene el suyo): el fondo de cada tarjeta del
// handoff era solo el lienzo de la muestra. Lo que sí es parte del diseño se
// queda (tarjetas de 1d / 1e / 1l, cristal de 1k, chips, botones) y va del
// color del botón "Detalles" del zigzag (`surface` / `onSurface`); los
// botones dentro de una tarjeta, primary con texto accent. `ink` es el color de los textos del bloque.
//
// Visual de cada momento (handoff §3): "art" = ilustración → foto → ícono
// (un ícono / vector elegido en Elementos va primero: es la ilustración);
// "photo" = foto → ilustración → ícono; "map" = mapa de Maps → foto →
// ilustración → ícono; "icon" = solo el ícono.

export const ITINERARY_STYLE_IDS = ["1a", "1b", "1c", "1d", "1e", "1f", "1g", "1h", "1i", "1j", "1k", "1l"] as const;
export type ItineraryStyleId = (typeof ITINERARY_STYLE_IDS)[number];

type Colors = { primary: string; secondary: string; accent: string; actions: string };

export type StyledItineraryProps = {
  styleId: ItineraryStyleId;
  items: ItineraryItem[];
  ink: string;
  // Color del botón "Detalles" del zigzag (1a) y su texto: tarjetas, chips y
  // botones de todos los estilos van de este color.
  surface: string;
  onSurface: string;
  colors: Colors;
  sans: string;
  serif: string;
  cta: string;
  editMode: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  // Props de edición del renglón (elegir, arrastrar): las de useEditableList.
  row: (_index: number, _style?: React.CSSProperties) => Record<string, unknown>;
  showDelete: (_index: number) => boolean;
  onDelete: (_index: number) => void;
  onOpen: (_index: number) => void;
  // En el editor envuelve el visual en el botón que cambia el ícono.
  iconSlot: (_index: number, _node: React.ReactNode) => React.ReactNode;
  renderIcon: (_icon: number | string | null, _size: number, _color: string) => React.ReactNode;
  addButton: React.ReactNode;
};

const alpha = (hex: string, a: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// "4:00 pm" → { hh: "4:00", ampm: "PM" }
const splitTime = (time: string | null) => {
  const m = /^\s*([\d:.]+)\s*([ap]\.?\s?m\.?)?/i.exec(time ?? "");
  return { hh: m?.[1] ?? (time ?? ""), ampm: (m?.[2] ?? "").replace(/[\s.]/g, "").toUpperCase() };
};

const addressText = (a?: Address) =>
  a ? [a.street && `${a.street} ${a.number ?? ""}`.trim(), a.neighborhood, a.city, a.state, a.country].filter(Boolean).join(", ") : "";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Imagen que cubre su contenedor; si no carga, `fallback`.
function Cover({ src, fallback, style }: { src: string; fallback: React.ReactNode; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" draggable={false} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
}

export function StyledItinerary(p: StyledItineraryProps) {
  const { styleId, items, ink, surface, onSurface, colors, sans, serif, cta, editMode, listRef, row, showDelete, onDelete, onOpen, iconSlot, renderIcon, addButton } = p;
  const soft = alpha(ink, 0.65);
  // Relleno detrás de un ícono; una imagen (ilustración) no lleva: se ve
  // directo sobre la tarjeta.
  const fill = (icon: ItineraryItem["icon"], color: string) => (isImageIcon(icon) ? "transparent" : color);
  const line = alpha(ink, 0.3);

  // Visual del momento dentro de un contenedor (mismo tamaño y forma si cae
  // al ícono: centrado, ~40%, sobre el color Fondo).
  const visual = (item: ItineraryItem, mode: "art" | "photo" | "map", box: React.CSSProperties, iconColor = onSurface) => {
    const art = isImageIcon(item.icon) ? item.icon : null;
    const photo = item.image || null;
    // Ícono elegido en Elementos (vector, ícono, forma): en los acomodos de
    // ilustración ("art") cuenta como la ilustración del momento y gana sobre
    // la foto. Un vector llena más el círculo, como una ilustración.
    const elegido = isGlyphIcon(item.icon);
    const esVector = elegido && String(item.icon).startsWith("svg:") && esUrlDeVector(String(item.icon).slice(4).split(SEPARADOR_COLOR)[0]);
    const size = Math.round(Math.min(Number(box.width) || 96, Number(box.height) || 96) * (mode === "art" && esVector ? 0.62 : 0.4));
    const glyph = (
      <div style={{ ...box, display: "grid", placeItems: "center", background: surface, overflow: "hidden" }}>
        {renderIcon(item.icon, size || 28, iconColor)}
      </div>
    );
    const order = mode === "art" ? [art, photo] : [photo, art];
    const src = mode === "art" && elegido ? undefined : (order.find(Boolean) as string | undefined);
    const imgNode = src
      // El marco (círculo de 1h, recuadro de 1b…) va del color de las
      // tarjetas; la ilustración entra con aire para no cortarse.
      ? <div style={{ ...box, overflow: "hidden", background: surface, boxSizing: "border-box", padding: src === art ? "12%" : 0 }}><Cover src={src} fallback={glyph} style={src === art ? { objectFit: "contain" } : undefined} /></div>
      : glyph;
    if (mode === "map") {
      const addr = addressText(item.address);
      if (addr && MAPS_KEY) {
        const pin = /^#?([0-9a-f]{6})$/i.exec(colors.actions)?.[1] ?? "E0475B";
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(addr)}&zoom=15&size=343x84&scale=2&markers=color:0x${pin}%7C${encodeURIComponent(addr)}&key=${MAPS_KEY}`;
        return <div style={{ ...box, overflow: "hidden" }}><Cover src={url} fallback={imgNode} /></div>;
      }
    }
    return imgNode;
  };

  const Cta = ({ i, style, icon = "up" }: { i: number; style?: React.CSSProperties; icon?: "up" | "right" | "none" }) => (
    <button
      type="button"
      data-edit-row-delete
      onClick={(e) => { e.stopPropagation(); onOpen(i); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: sans, color: "inherit", ...style }}
    >
      {icon === "up" && <ArrowUpRight size={14} />}
      {cta}
      {icon === "right" && <ArrowRight size={13} />}
    </button>
  );
  const del = (i: number) => showDelete(i) && (
    <button type="button" className="edit_row_delete" data-edit-row-delete onClick={(e) => { e.stopPropagation(); onDelete(i); }}>Eliminar</button>
  );
  const add = editMode ? <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>{addButton}</div> : null;
  const base: React.CSSProperties = { width: "100%", boxSizing: "border-box", textAlign: "left", color: ink };

  switch (styleId) {
    // ── Riel izquierdo ──
    case "1b":
      return (
        <div style={base}>
          <div ref={listRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22, paddingLeft: 28 }}>
            <span style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: line }} />
            {items.map((it, i) => (
              <div key={i} {...row(i, { position: "relative", display: "flex", gap: 14, alignItems: "flex-start" })}>
                <span style={{ position: "absolute", left: -28, top: 4, width: 15, height: 15, borderRadius: "50%", background: surface, border: `2px solid ${ink}`, boxSizing: "border-box" }} />
                {iconSlot(i, visual(it, "art", { width: 64, height: 64, borderRadius: 14, flex: "none" }))}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, color: colors.actions }}>{it.time}</span>
                  <span style={{ fontFamily: sans, fontSize: 17, fontWeight: 500 }}>{it.name}</span>
                  <span style={{ fontFamily: sans, fontSize: 13, color: soft, lineHeight: 1.35 }}>{it.subtext}</span>
                  <Cta i={i} style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }} />
                  {del(i)}
                </div>
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Hora primero ──
    case "1c":
      return (
        <div style={base}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {items.map((it, i) => {
              const t = splitTime(it.time);
              return (
                <div key={i} {...row(i, { display: "grid", gridTemplateColumns: "86px 1px minmax(0, 1fr)", gap: 16, alignItems: "stretch" })}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop: 2 }}>
                    <span style={{ fontFamily: serif, fontSize: 34, fontWeight: 500, lineHeight: 1 }}>{t.hh}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 2 }}>{t.ampm}</span>
                  </div>
                  <span style={{ background: line }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: 6, minWidth: 0 }}>
                    {iconSlot(i, <span style={{ display: "inline-flex", width: 24, height: 24 }}>{renderIcon(it.icon, 22, colors.actions)}</span>)}
                    <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 600 }}>{it.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 12.5, lineHeight: 1.35, color: soft }}>{it.subtext}</span>
                    <Cta i={i} icon="right" style={{ marginTop: 6, alignSelf: "flex-start", height: 30, padding: "0 14px", borderRadius: 99, background: surface, color: onSurface, fontSize: 12, fontWeight: 500 }} />
                    {del(i)}
                  </div>
                </div>
              );
            })}
          </div>
          {add}
        </div>
      );

    // ── Tarjetas conectadas ──
    case "1d":
      return (
        <div style={base}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {items.map((it, i) => (
              <div key={i} {...row(i, { width: "100%", display: "flex", flexDirection: "column", alignItems: "center" })}>
                <div style={{ width: "100%", boxSizing: "border-box", background: surface, borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)", color: onSurface }}>
                  {iconSlot(i, <div style={{ width: 52, height: 52, flex: "none", borderRadius: "50%", background: fill(it.icon, onSurface), display: "grid", placeItems: "center" }}>{renderIcon(it.icon, 22, surface)}</div>)}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 600 }}>{it.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 12.5, opacity: 0.7 }}>{it.subtext}</span>
                    <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500 }}>{it.time}</span>
                  </div>
                  <Cta i={i} icon="none" style={{ height: 32, padding: "0 12px", flex: "none", borderRadius: 99, background: colors.primary, color: colors.accent, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }} />
                </div>
                {del(i)}
                {i < items.length - 1 && <span style={{ width: 0, height: 24, borderLeft: `2px dashed ${line}` }} />}
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Horizontal deslizable ──
    case "1e":
      return (
        <div style={{ ...base, overflow: "hidden" }}>
          <div className="scroll-invitation" style={{ position: "relative", overflowX: "auto", paddingBottom: 6 }}>
            <div ref={listRef} style={{ position: "relative", display: "flex", gap: 12, width: "max-content" }}>
              <span style={{ position: "absolute", left: 0, right: 0, top: 10, height: 1, background: line }} />
              {items.map((it, i) => (
                <div key={i} {...row(i, { flex: "none", width: 200, display: "flex", flexDirection: "column", gap: 14 })}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                    <span style={{ width: 21, height: 21, borderRadius: "50%", background: ink, border: `5px solid ${surface}`, boxShadow: `0 0 0 1px ${ink}`, boxSizing: "border-box" }} />
                    <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{it.time}</span>
                  </div>
                  <div style={{ borderRadius: 18, background: surface, padding: 14, display: "flex", flexDirection: "column", gap: 6, color: onSurface }}>
                    {iconSlot(i, visual(it, "photo", { width: 172, height: 96, borderRadius: 12 }))}
                    <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 500 }}>{it.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 12.5, opacity: 0.65, lineHeight: 1.35, minHeight: 34 }}>{it.subtext}</span>
                    <Cta i={i} style={{ justifyContent: "center", height: 32, borderRadius: 99, background: colors.primary, color: colors.accent, fontSize: 12.5, fontWeight: 500 }} />
                    {del(i)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {add}
        </div>
      );

    // ── Editorial numerado ──
    case "1f":
      return (
        <div style={base}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column" }}>
            {items.map((it, i) => (
              <div key={i} {...row(i, { display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) auto", gap: 12, alignItems: "start", borderTop: `1px solid ${ink}`, padding: "16px 0" })}>
                <span style={{ fontFamily: serif, fontSize: 40, fontWeight: 500, lineHeight: 0.9 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 22 }}>{it.name}</span>
                  <span style={{ fontFamily: sans, fontSize: 12.5, color: soft, lineHeight: 1.35 }}>{it.subtext}</span>
                  <Cta i={i} icon="none" style={{ marginTop: 6, alignSelf: "flex-start", fontSize: 12, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 3 }} />
                  {del(i)}
                </div>
                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{it.time}</span>
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Nodos con ícono ──
    case "1g":
      return (
        <div style={base}>
          <div ref={listRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22 }}>
            <span style={{ position: "absolute", left: 23, top: 24, bottom: 24, width: 1, background: line }} />
            {items.map((it, i) => (
              <div key={i} {...row(i, { position: "relative", display: "flex", gap: 16, alignItems: "center" })}>
                {iconSlot(i, <div style={{ width: 48, height: 48, flex: "none", borderRadius: "50%", background: fill(it.icon, surface), display: "grid", placeItems: "center", boxSizing: "border-box" }}>{renderIcon(it.icon, 20, onSurface)}</div>)}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 500 }}>{it.name}</span>
                  <span style={{ fontFamily: sans, fontSize: 12.5, color: soft }}>{it.subtext}</span>
                  {del(i)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{it.time}</span>
                  <Cta i={i} icon="none" style={{ height: 26, padding: "0 10px", borderRadius: 99, background: surface, color: onSurface, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }} />
                </div>
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Ilustración centrada ──
    case "1h":
      return (
        <div style={{ ...base, textAlign: "center" }}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {items.map((it, i) => (
              <div key={i} {...row(i, { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 })}>
                {iconSlot(i, visual(it, "art", { width: 110, height: 110, borderRadius: "50%" }))}
                <span style={{ marginTop: 8, fontFamily: sans, fontSize: 12, letterSpacing: 3 }}>{it.time}</span>
                <span style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>{it.name}</span>
                <span style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.35, maxWidth: 240, color: soft }}>{it.subtext}</span>
                <Cta i={i} icon="none" style={{ marginTop: 6, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${colors.actions}`, paddingBottom: 2 }} />
                {del(i)}
                {i < items.length - 1 && <span style={{ width: 0, height: 36, borderLeft: `1.5px dotted ${line}`, margin: "12px 0" }} />}
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Programa clásico (con marco) ──
    case "1i":
      return (
        <div style={base}>
          <div style={{ border: `1px solid ${line}`, padding: "22px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 10, letterSpacing: 6, color: soft }}>◆ ◆ ◆</span>
            <div ref={listRef} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
              {items.map((it, i) => (
                <div key={i} {...row(i, { width: "100%", display: "flex", flexDirection: "column", gap: 4 })}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: serif, fontSize: 21, fontWeight: 600 }}>{it.name}</span>
                    <span style={{ flex: 1, borderBottom: `1px dotted ${line}`, transform: "translateY(-4px)" }} />
                    <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{it.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 15, color: soft }}>{it.subtext}</span>
                    <Cta i={i} icon="none" style={{ fontSize: 11.5, fontWeight: 500, color: colors.actions, textDecoration: "underline", textUnderlineOffset: 3, whiteSpace: "nowrap" }} />
                  </div>
                  {del(i)}
                </div>
              ))}
            </div>
          </div>
          {add}
        </div>
      );

    // ── Arcos: hasta 3 a la vista y luego scroll de lado; 2 llenan el
    //    ancho; 1 va centrado con ancho máximo. ──
    case "1j": {
      const n = items.length;
      const col = n >= 3 ? "calc((100% - 20px) / 3)" : n === 2 ? "calc((100% - 10px) / 2)" : "min(100%, 200px)";
      return (
        <div style={{ ...base, textAlign: "center" }}>
          <div className="scroll-invitation" style={{ overflowX: n > 3 ? "auto" : "visible", paddingBottom: n > 3 ? 6 : 0 }}>
          <div ref={listRef} style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: col, justifyContent: n === 1 ? "center" : "start", gap: 10, width: "100%" }}>
            {items.map((it, i) => (
              <div key={i} {...row(i, { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 })}>
                {iconSlot(i, visual(it, "photo", { width: "100%", aspectRatio: "3 / 4", borderRadius: "99px 99px 10px 10px", border: `1px solid ${line}`, boxSizing: "border-box" }))}
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{it.time}</span>
                <span style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, lineHeight: 1 }}>{it.name}</span>
                <span style={{ fontFamily: sans, fontSize: 11, lineHeight: 1.3, minHeight: 43, color: soft }}>{it.subtext}</span>
                <Cta i={i} icon="none" style={{ height: 28, padding: "0 10px", borderRadius: 99, background: surface, color: onSurface, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }} />
                {del(i)}
              </div>
            ))}
          </div>
          </div>
          {add}
        </div>
      );
    }

    // ── Chips de hora (cristal) ──
    case "1k":
      return (
        <div style={base}>
          <div ref={listRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: line }} />
            {items.map((it, i) => (
              <div key={i} {...row(i, { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 })}>
                <span style={{ height: 28, padding: "0 14px", borderRadius: 99, background: surface, color: onSurface, display: "inline-flex", alignItems: "center", fontFamily: sans, fontSize: 12.5, fontWeight: 600 }}>{it.time}</span>
                <div style={{ width: "100%", boxSizing: "border-box", borderRadius: 20, background: alpha(surface, 0.55), backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${alpha(surface, 0.8)}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, color: onSurface }}>
                  {iconSlot(i, <span style={{ display: "inline-flex" }}>{renderIcon(it.icon, 22, onSurface)}</span>)}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 600 }}>{it.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 12, opacity: 0.65 }}>{it.subtext}</span>
                  </div>
                  <Cta i={i} icon="none" style={{ height: 30, padding: "0 12px", borderRadius: 99, background: colors.primary, color: colors.accent, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }} />
                </div>
                {del(i)}
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    // ── Con mapa ──
    case "1l":
      return (
        <div style={base}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((it, i) => (
              <div key={i} {...row(i, { background: surface, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", color: onSurface })}>
                <div
                  style={{ position: "relative", cursor: "pointer" }}
                  data-edit-row-delete={!editMode || undefined}
                  onClick={editMode ? undefined : () => onOpen(i)}
                >
                  {visual(it, "map", { width: "100%", height: 84 })}
                  <span style={{ position: "absolute", left: 10, top: 10, height: 24, padding: "0 10px", borderRadius: 99, background: colors.primary, color: colors.accent, display: "inline-flex", alignItems: "center", fontFamily: sans, fontSize: 11.5, fontWeight: 600 }}>{it.time}</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  {iconSlot(i, <div style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: fill(it.icon, alpha(onSurface, 0.06)), display: "grid", placeItems: "center" }}>{renderIcon(it.icon, 18, onSurface)}</div>)}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 600 }}>{it.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 12, opacity: 0.6 }}>{it.subtext}</span>
                  </div>
                  <Cta i={i} style={{ height: 32, padding: "0 12px", borderRadius: 99, background: colors.primary, color: colors.accent, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }} />
                </div>
                {showDelete(i) && <div style={{ padding: "0 14px 12px" }}>{del(i)}</div>}
              </div>
            ))}
          </div>
          {add}
        </div>
      );

    default:
      return null;
  }
}
