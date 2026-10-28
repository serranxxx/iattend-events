"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Compass, Hotel, Maximize2, Pencil, Plus, Utensils } from "lucide-react";
import { DestinationCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";

// Catálogo de Actividades y hospedaje (handoff "Actividades Catálogo"). El
// estilo vive en destinations.style: "1a" (o vacío) Revistero, 1e Llaveros de
// hotel y 1f Postales, con los mismos datos (destinations.cards). Card.tsx
// pone el drawer de edición.
//
// Sin fondo propio: el tablero de madera, los llaveros, las postales y las
// caras de papel son piezas del diseño. El color de cada tipo es fijo (sirve
// para reconocer la categoría) y no cambia con la paleta.
//
// Modo edición: tocar la revista del frente (1a), la ficha (1e) o la postal
// del frente (1f) abre el drawer de edición de Card.tsx (`onEdit`); "+ Lugar" agrega (`onAdd`).

export const DEST_STYLE_IDS = ["1a", "1e", "1f"] as const;
export type DestStyleId = (typeof DEST_STYLE_IDS)[number];

const EASE = "cubic-bezier(.2,.8,.2,1)";

type Props = {
  styleId: DestStyleId;
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  cards: DestinationCard[];
  editMode?: boolean;
  onEdit?: (_index: number) => void;
  addButton?: React.ReactNode;
};

const TYPES = {
  activitie: { color: "#3FA66B", Icon: Compass },
  hotel: { color: "#2E8BD8", Icon: Hotel },
  food: { color: "#C2793A", Icon: Utensils },
} as const;

const shade = (hex: string, t: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const reducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Lienzo de 375 px escalado al ancho disponible (transform, no `zoom`: Safari).
function Fit({ height, children }: { height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / 375) || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height: height * scale, position: "relative" }}>
      <div style={{ position: "absolute", left: "50%", top: 0, width: 375, height, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "50% 0" }}>
        {children}
      </div>
    </div>
  );
}

export function StyledDestinations({ styleId, invitation, ui, cards, editMode = false, onEdit, addButton }: Props) {
  const n = cards.length;
  const g = invitation.generals;
  const primary = g?.colors?.primary ?? "#FFFFFF";
  const accent = g?.colors?.accent ?? "#29262D";
  const content = invitation.destinations;
  // Texto suelto sobre el bloque.
  const ink = content?.dynamic_background?.active && content?.inverted ? primary : accent;
  const sans = g?.fonts?.body?.typeFace ?? "Outfit";
  const serif = g?.fonts?.titles?.typeFace ?? sans;
  const reduced = reducedMotion();
  const navLabel = ui?.labels?.navigate ?? "Navegar";

  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  useEffect(() => { if (idx >= n) setIdx(0); }, [n]);
  useEffect(() => { setIdx(0); setFlip(false); }, [styleId]);

  const typeOf = (c: DestinationCard) => {
    const t = TYPES[c.type] ?? { color: accent, Icon: Compass };
    const label = c.type === "hotel" ? ui?.labels?.lodging : c.type === "food" ? ui?.labels?.food : ui?.labels?.activities;
    return { ...t, label: label ?? (c.type === "hotel" ? "Hospedaje" : c.type === "food" ? "Gastronomía" : "Actividades") };
  };
  const photo = (c: DestinationCard, color: string): React.CSSProperties => (
    c.image
      ? { backgroundImage: `url("${c.image}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: `linear-gradient(160deg, ${shade(color, 0.45)} 0%, ${color} 60%, ${shade(color, -0.35)} 100%)` }
  );
  const navigate = (c: DestinationCard) => { if (!editMode && c.url) window.open(c.url, "_blank", "noopener,noreferrer"); };
  const keys = (fn: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } },
  });
  const cta = (c: DestinationCard, h = 36) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); navigate(c); }}
      style={{ alignSelf: "flex-start", height: h, padding: `0 ${h > 32 ? 16 : 12}px`, border: "none", borderRadius: 99, background: accent, color: primary, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: h > 32 ? 12.5 : 11.5, fontWeight: 500, cursor: "pointer", flex: "none" }}
    >
      <ArrowUpRight size={14} />{navLabel}
    </button>
  );
  // Lápiz de "toca para editar" (modo edición); en la postal va a la izquierda
  // para no tapar el timbre.
  const editHint = (left = false) => editMode && (
    <span style={{ position: "absolute", top: 8, ...(left ? { left: 8 } : { right: 8 }), width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.92)", color: "#29262D", display: "grid", placeItems: "center", boxShadow: "0 2px 6px rgba(0,0,0,.2)", zIndex: 5 }}>
      <Pencil size={13} />
    </span>
  );

  if (n === 0) return <>{addButton}</>;

  // Flechas ‹ › redondas (1a y 1f).
  const roundArrow = (onClick: () => void, Icon: React.ElementType, label: string) => (
    <span {...keys(onClick)} aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ width: 40, height: 40, borderRadius: "50%", background: "#FFFFFF", color: "#1B1B1B", boxShadow: "0 2px 8px rgba(0,0,0,.08)", display: "grid", placeItems: "center", cursor: "pointer" }}>
      <Icon size={18} />
    </span>
  );

  switch (styleId) {
    // ── Revistero ──
    case "1a": {
      const cur = Math.min(idx, n - 1);
      const go = (d: number) => { setIdx((k) => (k + d + n) % n); setFlip(false); };
      // Frente, segunda y tercera en abanico; del resto, nada (se esconden detrás).
      const POS = ["translate(-26px, 36px) rotate(-7deg)", "translate(30px, -2px) rotate(5deg)", "translate(60px, -28px) rotate(12deg)"];
      return (
        <div style={{ width: "100%" }}>
          <Fit height={n > 1 ? 470 : 420}>
            {cards.map((c, i) => {
              const t = typeOf(c);
              const pos = (i - cur + n) % n;
              const front = pos === 0;
              const turned = front && flip;
              const tap = () => {
                if (!front) { setIdx(i); setFlip(false); return; }
                if (editMode) onEdit?.(i); else setFlip((f) => !f);
              };
              return (
                <div
                  key={i}
                  {...keys(tap)}
                  aria-label={`${t.label}: ${c.name ?? ""}`}
                  onClick={(e) => { e.stopPropagation(); tap(); }}
                  style={{ position: "absolute", left: 78, top: 56, width: 220, height: 300, perspective: 1200, zIndex: n - pos, opacity: pos > 2 ? 0 : 1, transform: turned && !reduced ? "translate(0px, 18px) rotate(0deg) scale(1.08)" : POS[Math.min(pos, 2)], transition: `transform .55s ${EASE}, opacity .4s`, cursor: "pointer", pointerEvents: pos > 2 ? "none" : "auto" }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: reduced ? undefined : `transform .7s ${EASE}`, transform: turned && !reduced ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                    {/* Portada */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "6px 18px 6px 6px", background: "#FFFFFF", padding: 6, boxShadow: "0 16px 30px rgba(0,0,0,.25)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: reduced && turned ? 0 : 1, transition: "opacity .3s", boxSizing: "border-box" }}>
                      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "3px 14px 3px 3px", overflow: "hidden", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", ...photo(c, t.color) }}>
                        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.28), transparent 35%, transparent 70%, rgba(0,0,0,.3))" }} />
                        <span style={{ position: "relative", fontFamily: serif, fontSize: 26, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,.35)", textAlign: "left" }}>{c.name}</span>
                        <span style={{ position: "relative", alignSelf: "center", width: 54, height: 54, borderRadius: "50%", background: t.color, opacity: 0.85, color: "#FFFFFF", display: "grid", placeItems: "center" }}>
                          {editMode && front ? <Pencil size={20} /> : <Maximize2 size={22} />}
                        </span>
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#FFFFFF", textShadow: "0 1px 4px rgba(0,0,0,.35)" }}>{t.label}</span>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", background: t.color, color: "#FFFFFF", display: "grid", placeItems: "center" }}><t.Icon size={13} /></span>
                        </div>
                      </div>
                    </div>
                    {/* Información */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "6px 18px 6px 6px", background: "linear-gradient(135deg, #F7F5F1, #E8E5DF)", boxShadow: "0 16px 30px rgba(0,0,0,.2)", transform: reduced ? undefined : "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: reduced && !turned ? 0 : 1, transition: "opacity .3s", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box", textAlign: "left" }}>
                      <span style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: "#1B1B1B" }}>{ui?.labels?.information ?? "Información"}</span>
                      <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 11, fontWeight: 500, color: "#4C4550" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />{t.label} · {c.name}
                      </span>
                      <span className="scroll-invitation" style={{ flex: 1, minHeight: 0, fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: "#1B1B1B", overflowY: "auto", whiteSpace: "pre-line" }}>{c.description}</span>
                      {c.url && <button type="button" onClick={(e) => { e.stopPropagation(); navigate(c); }} style={{ alignSelf: "flex-start", height: 38, padding: "0 18px", border: "none", borderRadius: 99, background: "#1B1B1B", color: "#FFFFFF", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13, fontWeight: 500, cursor: "pointer", flex: "none" }}><ArrowUpRight size={15} />{navLabel}</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {n > 1 && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                {roundArrow(() => go(-1), ChevronLeft, "Anterior")}
                <span style={{ fontFamily: sans, fontSize: 13, color: ink, opacity: 0.8, minWidth: 44, textAlign: "center" }}>{cur + 1} / {n}</span>
                {roundArrow(() => go(1), ChevronRight, "Siguiente")}
              </div>
            )}
          </Fit>
          {addButton}
        </div>
      );
    }

    // ── Llaveros de hotel ──
    // Una llave por tipo (en el orden en que aparecen). Debajo, las fichas de
    // los lugares de ese tipo; si hay varios, en fila con scroll de lado.
    case "1e": {
      const groups: { type: DestinationCard["type"]; items: number[] }[] = [];
      cards.forEach((c, i) => {
        const g = groups.find((x) => x.type === c.type);
        if (g) g.items.push(i); else groups.push({ type: c.type, items: [i] });
      });
      const gn = groups.length;
      const cur = Math.min(idx, gn - 1);
      const group = groups[cur];
      const st = typeOf(cards[group.items[0]]);
      const room = (i: number) => String((i + 1) * 100 + 1 + i * 3);
      const gap = gn <= 2 ? 64 : gn === 3 ? 40 : 22;
      const many = group.items.length > 1;
      const ficha = (ci: number, k: number) => {
        const c = cards[ci];
        return (
          <div
            key={ci}
            {...(editMode ? keys(() => onEdit?.(ci)) : {})}
            onClick={editMode ? (e) => { e.stopPropagation(); onEdit?.(ci); } : undefined}
            // Foto arriba a todo el ancho y el texto debajo.
            style={{ position: "relative", flex: many ? "none" : undefined, width: many ? "calc(100% - 44px)" : "100%", scrollSnapAlign: "start", display: "flex", flexDirection: "column", gap: 14, cursor: editMode ? "pointer" : undefined, textAlign: "left" }}
          >
            {editHint()}
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "4px 14px 4px 4px", boxShadow: "0 6px 14px rgba(0,0,0,.15)", ...photo(c, st.color) }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, color: ink }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.75 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />{st.label} · {room(cur)}{many ? ` · ${k + 1}/${group.items.length}` : ""}
              </span>
              <span style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, lineHeight: 1.05 }}>{c.name}</span>
              <span style={{ fontFamily: serif, fontSize: 15.5, lineHeight: 1.45, whiteSpace: "pre-line" }}>{c.description}</span>
              {c.url && <div style={{ marginTop: 4 }}>{cta(c)}</div>}
            </div>
          </div>
        );
      };
      return (
        <div style={{ width: "100%", maxWidth: 375, margin: "0 auto", display: "flex", flexDirection: "column" }}>
          {/* Tablero de recepción */}
          <div style={{ position: "relative", height: 300, borderRadius: 18, background: "linear-gradient(180deg, #6B5241, #4E3B2F)", padding: "22px 0 0", boxShadow: "0 10px 24px rgba(0,0,0,.18)", overflow: "hidden" }}>
            <span style={{ display: "block", textAlign: "center", fontFamily: serif, fontSize: 13, fontWeight: 600, letterSpacing: 4, color: "#E5D3B3", textTransform: "uppercase" }}>— {ui?.labels?.reception ?? "Recepción"} —</span>
            <div className="scroll-invitation" style={{ position: "absolute", left: 0, right: 0, top: 50, bottom: 0, overflowX: gn > 4 ? "auto" : "visible", padding: "6px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: gn > 4 ? "flex-start" : "center", gap, width: gn > 4 ? "max-content" : "100%" }}>
                {groups.map((g, i) => {
                  const t = typeOf(cards[g.items[0]]);
                  const on = i === cur;
                  return (
                    <div
                      key={g.type}
                      {...keys(() => setIdx(i))}
                      aria-label={t.label}
                      onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", transformOrigin: "50% 0", transform: on && !reduced ? "rotate(5deg) translateY(8px)" : "none", transition: "transform .5s cubic-bezier(.3,1.6,.5,1)", flex: "none" }}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #F3DDA8, #B38B45)" }} />
                      <span style={{ width: 22, height: 22, marginTop: -4, borderRadius: "50%", border: "3px solid #CDAE6E", boxSizing: "border-box" }} />
                      <span style={{ width: 8, height: 26, marginTop: -3, borderRadius: 3, background: "linear-gradient(90deg, #B38B45, #F3DDA8, #B38B45)" }} />
                      <div style={{ width: 62, height: 178, marginTop: -2, borderRadius: 30, background: `linear-gradient(180deg, ${shade(t.color, -0.1)}, ${shade(t.color, -0.42)})`, boxShadow: `0 8px 14px rgba(0,0,0,.35), inset 0 0 0 3px rgba(255,255,255,.18)${on ? ", 0 0 0 2px rgba(255,255,255,.55)" : ""}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 0 18px", color: "#FFFFFF", boxSizing: "border-box" }}>
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#4E3B2F", boxShadow: "inset 0 1px 2px rgba(0,0,0,.5)" }} />
                        <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: serif, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", maxHeight: 122, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.label}</span>
                        <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{room(i)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Fichas del tipo elegido (siempre visibles) */}
          <div
            key={group.type}
            className="scroll-invitation"
            style={many
              ? { display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", padding: "20px 4px 8px" }
              : { padding: "20px 4px" }}
          >
            {group.items.map((ci, k) => ficha(ci, k))}
          </div>
          {addButton}
        </div>
      );
    }

    // ── Postales ──
    case "1f": {
      const cur = Math.min(idx, n - 1);
      const go = (d: number) => { setIdx((k) => (k + d + n) % n); setFlip(false); };
      // Matasellos: ciudad del primer momento con dirección + fecha del evento.
      const city = invitation.itinerary?.object?.find((m) => m.address?.city)?.address?.city ?? "";
      const raw = invitation.cover?.date?.value ?? "";
      const [y, mo, d] = raw.split("T")[0].split("-");
      const stamp = [city.slice(0, 4).toUpperCase(), d && mo && y ? `${d}·${mo}·${y.slice(2)}` : ""].filter(Boolean);
      return (
        <div style={{ width: "100%" }}>
          <Fit height={n > 1 ? 330 : 260}>
            {cards.map((c, i) => {
              const t = typeOf(c);
              const pos = (i - cur + n) % n;
              const front = pos === 0;
              const turned = front && flip;
              const tap = () => { if (!front) return; if (editMode) onEdit?.(i); else setFlip((f) => !f); };
              return (
                <div
                  key={i}
                  {...keys(tap)}
                  aria-label={`${t.label}: ${c.name ?? ""}`}
                  onClick={(e) => { e.stopPropagation(); tap(); }}
                  style={{ position: "absolute", left: 24, top: 16, width: 327, height: 218, perspective: 1400, zIndex: n - pos, opacity: pos > 2 ? 0 : 1, transform: `translate(${pos * 6}px, ${pos * 10}px) rotate(${[0, 3, -3][pos] ?? 0}deg)`, transition: `transform .55s ${EASE}, opacity .4s`, cursor: front ? "pointer" : "default", pointerEvents: front ? "auto" : "none" }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: reduced ? undefined : `transform .7s ${EASE}`, transform: turned && !reduced ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                    {/* Frente */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#FFFFFF", padding: 8, boxShadow: "0 12px 26px rgba(0,0,0,.2)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: reduced && turned ? 0 : 1, transition: "opacity .3s", boxSizing: "border-box" }}>
                      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 2, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxSizing: "border-box", overflow: "hidden", ...photo(c, t.color) }}>
                        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.45))" }} />
                        <div style={{ position: "absolute", top: 10, right: 10, width: 46, height: 56, background: "#FFFFFF", padding: 4, border: "2px dashed #E7EDEF", boxSizing: "border-box" }}>
                          <div style={{ width: "100%", height: "100%", background: t.color, display: "grid", placeItems: "center", color: "#FFFFFF" }}><t.Icon size={16} /></div>
                        </div>
                        <span style={{ position: "relative", fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#FFFFFF", opacity: 0.9 }}>{t.label}</span>
                        <span style={{ position: "relative", fontFamily: serif, fontStyle: "italic", fontSize: 32, fontWeight: 600, lineHeight: 1, color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,.3)", textAlign: "left" }}>{c.name}</span>
                        {front && editHint(true)}
                      </div>
                    </div>
                    {/* Reverso */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#FBF9F4", boxShadow: "0 12px 26px rgba(0,0,0,.16)", transform: reduced ? undefined : "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: reduced && !turned ? 0 : 1, transition: "opacity .3s", padding: 16, display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) 1px minmax(0, 1fr)", gap: 12, boxSizing: "border-box", textAlign: "left" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        <span style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, color: "#1B1B1B", lineHeight: 1.05 }}>{c.name}</span>
                        <span style={{ flex: 1, fontFamily: serif, fontSize: 13.5, lineHeight: 1.38, color: "#29262D", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", whiteSpace: "pre-line" }}>{c.description}</span>
                        {c.url && cta(c, 30)}
                      </div>
                      <span style={{ background: "#D9D2C5" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ width: 52, height: 52, borderRadius: "50%", border: "1.5px solid rgba(22,50,61,.35)", display: "grid", placeItems: "center", fontFamily: sans, fontSize: 8, fontWeight: 600, letterSpacing: 1, color: "rgba(22,50,61,.55)", textAlign: "center", lineHeight: 1.2, transform: "rotate(-12deg)" }}>
                            {stamp.map((s, k) => <React.Fragment key={k}>{k > 0 && <br />}{s}</React.Fragment>)}
                          </span>
                          <div style={{ width: 40, height: 48, border: "1.5px dashed #B5B1AB", display: "grid", placeItems: "center", boxSizing: "border-box" }}><t.Icon size={15} color={t.color} /></div>
                        </div>
                        <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "#4C4550" }}>{ui?.labels?.toGuests ?? "Para: nuestros invitados"}</span>
                        <span style={{ height: 1, background: "#D9D2C5" }} />
                        <span style={{ fontFamily: sans, fontSize: 10.5, color: "#787878" }}>{t.label}</span>
                        <span style={{ height: 1, background: "#D9D2C5" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {n > 1 && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                {roundArrow(() => go(-1), ChevronLeft, "Anterior")}
                <div style={{ display: "flex", gap: 6 }}>
                  {cards.map((_, i) => <span key={i} style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 99, background: i === cur ? ink : `color-mix(in srgb, ${ink} 25%, transparent)`, transition: "width .3s" }} />)}
                </div>
                {roundArrow(() => go(1), ChevronRight, "Siguiente")}
              </div>
            )}
          </Fit>
          {addButton}
        </div>
      );
    }

    default:
      return null;
  }
}

export const AddPlaceButton = ({ onAdd }: { onAdd: () => void }) => (
  <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
    <button type="button" className="edit_glass_btn" data-edit-hit onClick={(e) => { e.stopPropagation(); onAdd(); }}><Plus size={14} /> Lugar</button>
  </div>
);
