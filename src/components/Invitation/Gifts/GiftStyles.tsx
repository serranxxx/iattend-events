"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { message } from "antd";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Copy, Gift, MailOpen, Plus, RefreshCw, X } from "lucide-react";
import { GiftCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import type { GiftBrand } from "@/lib/giftBrands/cache";
import { resolveGiftBrand } from "./Wallet/classifyGiftCard";

// Catálogo de la mesa de regalos (handoff "Mesa de Regalos Catálogo"). El
// estilo vive en gifts.style; "1a" (o vacío) es la cartera de siempre
// (Wallet.tsx, sin cambios). Aquí van 1c Sobre, 1e Baraja, 1f Girar tarjeta y
// 1h Caja de regalo, con los mismos datos (gifts.cards) y las marcas del
// catálogo gift_brands.
//
// El contenedor (sobre, caja) es del color de la cartera; sus textos siguen
// la regla de la paleta (sobre secondary, primary; sobre primary, accent).
//
// Modo edición: tocar una tarjeta la elige (la barra "gift_card:N" del editor
// edita sus datos), "×" la elimina y "+ Tarjeta" agrega otra (hasta 5).

export const GIFT_STYLE_IDS = ["1a", "1c", "1e", "1f", "1h"] as const;
export type GiftStyleId = (typeof GIFT_STYLE_IDS)[number];

const MAX_CARDS = 5;
const EASE = "cubic-bezier(.2,.8,.2,1)";

type Props = {
  styleId: Exclude<GiftStyleId, "1a">;
  invitation: NewInvitation;
  ui: InvitationUIBundle;
  brands?: GiftBrand[];
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  textBar?: boolean;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

// ── Color ──
const parse = (hex: string) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex ?? "");
  const n = m ? parseInt(m[1], 16) : 0x999999;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
// Mezcla `hex` hacia blanco (t > 0) o negro (t < 0).
const shade = (hex: string, t: number) => toHex(parse(hex).map((v) => (t > 0 ? v + (255 - v) * t : v * (1 + t))));
const alpha = (hex: string, a: number) => {
  const [r, g, b] = parse(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// "Ale & Santiago" → "A&S" (sello del sobre).
const monogram = (title: string) => {
  const parts = title.split(/\s*(?:&|\by\b|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}&${parts[1][0]}`.toUpperCase();
  return (title.trim()[0] ?? "").toUpperCase();
};

const reducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Lienzo de diseño de 375 px que se escala al ancho disponible (transform, no
// `zoom`: Safari no escala el texto con zoom). `height` es lo que se ve, desde
// abajo del lienzo (`canvas`): cerrado, el sobre / la caja no dejan un hueco
// arriba; al abrir el bloque crece al ritmo de las tarjetas.
function Fit({ height, canvas = height, children }: { height: number; canvas?: number; children: React.ReactNode }) {
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
    <div ref={ref} style={{ width: "100%", height: height * scale, position: "relative", transition: `height .6s ${EASE}` }}>
      <div style={{ position: "absolute", left: "50%", bottom: 0, width: 375, height: canvas, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "50% 100%" }}>
        {children}
      </div>
    </div>
  );
}

export function StyledGifts({ styleId, invitation, ui, brands = [], editMode = false, onFieldChange, textBar = false, onFieldTool }: Props) {
  const content = invitation.gifts;
  const cards = content.cards ?? [];
  const n = cards.length;
  const c = invitation.generals?.colors ?? ({} as NewInvitation["generals"]["colors"]);
  const primary = c.primary ?? "#FFFFFF";
  const secondary = c.secondary ?? "#B9AEDD";
  const accent = c.accent ?? "#29262D";
  const active = Boolean(content?.dynamic_background?.active);
  // Contenedor: el mismo color de la cartera (1a).
  const box = active ? (content.inverted ? primary : secondary) : content.inverted ? secondary : primary;
  const onBox = box === primary ? accent : primary;
  // Texto suelto sobre el bloque.
  const ink = active && content.inverted ? primary : accent;
  const font = invitation.generals?.fonts?.body?.typeFace ?? "Outfit";
  const serif = invitation.generals?.fonts?.titles?.typeFace ?? font;
  const names = invitation.cover?.title?.text?.value ?? "";
  const reduced = reducedMotion();
  const tr = (s: string) => (reduced ? "opacity .3s" : s);

  const [messageApi, holder] = message.useMessage();
  const rootRef = useRef<HTMLDivElement>(null);

  // Tarjeta elegida (abierta). Contenedor abierto en sobre / caja.
  const [sel, setSel] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [deck, setDeck] = useState(0);
  const [flip, setFlip] = useState<Record<number, boolean>>({});
  useEffect(() => { if (sel !== null && sel >= n) setSel(null); if (deck >= n) setDeck(0); }, [n]);
  // Al cambiar de estilo empieza cerrado.
  useEffect(() => { setSel(null); setOpen(false); setDeck(0); setFlip({}); }, [styleId]);

  // Editor de escritorio: avisa qué tarjeta quedó elegida (su barra).
  const barOpen = useRef(false);
  useEffect(() => {
    if (!editMode || !textBar) return;
    const r = rootRef.current?.getBoundingClientRect();
    const rect = { x: r?.left ?? 0, y: r?.top ?? 0, w: r?.width ?? 0, h: r?.height ?? 0 };
    if (sel !== null) { barOpen.current = true; onFieldTool?.(`gift_card:${sel}`, rect, "gifts"); }
    else if (barOpen.current) { barOpen.current = false; onFieldTool?.("gift_card_close", rect, "gifts"); }
  }, [sel, editMode, textBar]);

  const addCard = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const next = [...cards, { kind: "store", brand: null, url: null, bank: null, name: null, number: null } as GiftCard];
    onFieldChange?.("gifts.cards", next);
    setOpen(true);
    setSel(next.length - 1);
    if (styleId === "1e") setDeck(next.length - 1);
    if (styleId === "1f") setFlip((f) => ({ ...f, [next.length - 1]: true }));
  };
  const removeCard = (i: number) => {
    setSel(null);
    setFlip({});
    setDeck(0);
    onFieldChange?.("gifts.cards", cards.filter((_, k) => k !== i));
  };

  // ── Datos de una tarjeta ──
  const info = (card: GiftCard) => {
    const isStore = card.kind !== "bank";
    const value = isStore ? (card.url ?? "").replace(/^https?:\/\/(www\.)?/, "") : [card.name, card.number].filter(Boolean).join(" · ");
    return {
      isStore,
      value,
      kind: isStore ? ui.labels.registry ?? "Mesa de regalos" : ui.labels.transfer ?? "Transferencia",
      cta: isStore ? ui.labels.seeGifts : ui.labels.copyAccount ?? "Copiar cuenta",
      Icon: isStore ? ArrowUpRight : Copy,
    };
  };
  const act = async (card: GiftCard) => {
    if (editMode) return;
    if (card.kind !== "bank") { if (card.url) window.open(card.url, "_blank", "noopener,noreferrer"); return; }
    try {
      await navigator.clipboard.writeText(card.number ?? "");
      messageApi.info(ui.labels.copied ?? "Cuenta copiada");
    } catch { /* sin portapapeles */ }
  };
  const keys = (fn: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } },
  });

  const brandOf = (card: GiftCard) => {
    const m = resolveGiftBrand(card, brands);
    return {
      bg: m.background ?? (editMode && !m.background ? "#FFFFFF" : `linear-gradient(135deg, ${shade(accent, 0.25)} 0%, ${accent} 100%)`),
      fg: m.textColor ?? (editMode && !m.background ? "#29262D" : "#FFFFFF"),
      logo: m.logoUrl,
      label: (card.kind === "bank" ? card.bank : card.brand) || (editMode ? "Nueva tarjeta" : ""),
    };
  };

  // Cara de la tarjeta: logo y, si está abierta, valor + CTA.
  const face = ({ i, showInfo, logoLeft = false, compact = false, sub }: { i: number; showInfo: boolean; logoLeft?: boolean; compact?: boolean; sub?: React.ReactNode }) => {
    const card = cards[i];
    const b = brandOf(card);
    const d = info(card);
    return (
      <div style={{ position: "absolute", inset: 0, borderRadius: compact ? 12 : 16, background: b.bg, color: b.fg, boxShadow: "0 10px 24px rgba(0,0,0,.22)", padding: compact ? "10px 12px" : "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", fontFamily: font, boxSizing: "border-box" }}>
        <span style={{ alignSelf: logoLeft ? "flex-start" : "flex-end", height: compact ? 22 : 26, display: "flex", alignItems: "center", fontSize: compact ? 16 : 19, fontWeight: 600 }}>
          {b.logo ? <img src={b.logo} alt={b.label} style={{ height: "100%", maxWidth: 140, objectFit: "contain" }} /> : b.label}
        </span>
        {showInfo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", minWidth: 0 }}>
            {!compact && d.value && (
              <span style={{ fontSize: 11.5, border: "1.5px dashed currentColor", opacity: 0.85, borderRadius: 99, padding: "4px 10px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", boxSizing: "border-box" }}>{d.value}</span>
            )}
            <button
              type="button"
              data-edit-row-delete
              onClick={(e) => { e.stopPropagation(); act(card); }}
              style={{ height: compact ? 26 : 30, padding: compact ? "0 11px" : "0 14px", border: "none", borderRadius: 99, background: "#FFFFFF", color: "#1B1B1B", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: compact ? 11 : 12, fontWeight: 600, cursor: "pointer" }}
            >
              <d.Icon size={13} />{d.cta}
            </button>
          </div>
        ) : sub}
        {editMode && showInfo && (
          <button type="button" className="edit_card_remove" aria-label="Eliminar tarjeta" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeCard(i); }}>
            <X size={14} strokeWidth={2.6} />
          </button>
        )}
      </div>
    );
  };

  // Nombres + botón redondo (abre / cierra) del contenedor.
  const footer = ({ size, Icon, label }: { size: "md" | "sm"; Icon: React.ElementType; label: string }) => (
    <>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontFamily: font, fontSize: size === "md" ? 20 : 19, fontWeight: 700, color: onBox, lineHeight: 1.15 }}>{names}</span>
        <span style={{ fontFamily: font, fontSize: size === "md" ? 12.5 : 12, color: alpha(onBox, 0.8) }}>{ui.labels.cards}</span>
      </div>
      <span
        {...keys(() => toggle())}
        aria-label={label}
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        style={{ width: size === "md" ? 38 : 36, height: size === "md" ? 38 : 36, flex: "none", borderRadius: "50%", border: `1.5px solid ${alpha(onBox, 0.7)}`, color: onBox, display: "grid", placeItems: "center", cursor: "pointer" }}
      >
        <Icon size={16} />
      </span>
    </>
  );
  const toggle = () => { setOpen((o) => !o); setSel(null); };

  const addBtn = editMode && n < MAX_CARDS ? (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
      <button type="button" className="edit_glass_btn" data-edit-hit onClick={addCard}><Plus size={14} /> Tarjeta</button>
    </div>
  ) : null;

  const wrap = (node: React.ReactNode) => (
    <div ref={rootRef} data-edit-hit={editMode || undefined} style={{ width: "100%" }}>
      {holder}
      {node}
      {addBtn}
    </div>
  );

  if (n === 0) return wrap(null);

  // Escalonado al abrir sobre / caja: de 1 a 5 tarjetas en el mismo alto.
  const step = (span: number, max: number) => (n > 1 ? Math.min(max, span / (n - 1)) : 0);

  switch (styleId) {
    // ── Sobre ──
    case "1c": {
      const gap = step(112, 56);
      const front = shade(box, -0.06);
      return wrap(
        <Fit canvas={470} height={open ? 470 : 470 - 228}>
          {/* Reverso con forro rayado */}
          <div style={{ position: "absolute", left: 30, top: 240, width: 315, height: 205, borderRadius: 10, background: `repeating-linear-gradient(45deg, ${shade(box, -0.2)} 0 7px, ${shade(box, -0.25)} 7px 14px)`, boxShadow: `inset 0 0 0 6px ${shade(box, -0.2)}` }} />
          {/* Solapa */}
          <div
            style={{ position: "absolute", left: 30, top: 240, width: 315, height: 130, zIndex: open ? 1 : 10, transformOrigin: "50% 0", transform: open && !reduced ? "perspective(900px) rotateX(180deg)" : "perspective(900px) rotateX(0deg)", opacity: open && reduced ? 0 : 1, transition: tr(`transform .6s ${EASE}`), background: open ? shade(box, 0.08) : shade(box, -0.14), clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
          {cards.map((_, i) => {
            const isSel = sel === i;
            const top = !open ? 262 : isSel ? 20 : 34 + i * gap + (n === 1 ? 56 : 0);
            return (
              <div
                key={i}
                {...keys(() => open && setSel(isSel ? null : i))}
                aria-label={brandOf(cards[i]).label}
                onClick={(e) => { e.stopPropagation(); if (open) setSel(isSel ? null : i); }}
                style={{ position: "absolute", left: 45, top, width: 285, height: 178, zIndex: isSel ? 8 : i + 2, transition: tr(`top .6s ${EASE}`), transitionDelay: open && sel === null ? `${0.25 + i * 0.08}s` : "0s", cursor: open ? "pointer" : "default" }}
              >
                {face({ i, showInfo: open && isSel })}
              </div>
            );
          })}
          {/* Frente con corte en V, costura y pliegues */}
          <div style={{ position: "absolute", left: 30, top: 240, width: 315, height: 205, zIndex: 9, borderRadius: "0 0 10px 10px", background: `linear-gradient(180deg, ${shade(box, 0.06)} 0%, ${front} 100%)`, clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)", filter: "drop-shadow(0 8px 14px rgba(0,0,0,.12))" }}>
            <div style={{ position: "absolute", left: 9, right: 9, bottom: 9, top: 112, border: `1.5px dashed ${alpha(onBox, 0.35)}`, borderTop: "none", borderRadius: "0 0 8px 8px" }} />
            <span style={{ position: "absolute", left: 0, top: 0, width: "52%", height: 1, background: alpha(onBox, 0.25), transformOrigin: "0 0", transform: "rotate(18.7deg)" }} />
            <span style={{ position: "absolute", right: 0, top: 0, width: "52%", height: 1, background: alpha(onBox, 0.25), transformOrigin: "100% 0", transform: "rotate(-18.7deg)" }} />
          </div>
          {/* Sello de lacre */}
          <div style={{ position: "absolute", left: 165, top: 342, width: 46, height: 46, zIndex: 11, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${shade(accent, 0.2)}, ${accent})`, boxShadow: "0 3px 8px rgba(0,0,0,.3), inset 0 0 0 3px rgba(255,255,255,.12)", display: "grid", placeItems: "center", opacity: open ? 0 : 1, transform: open ? "scale(.6)" : "scale(1)", transition: "opacity .3s, transform .3s", pointerEvents: "none" }}>
            <span style={{ fontFamily: serif, fontSize: 15, fontWeight: 600, color: primary }}>{monogram(names)}</span>
          </div>
          <div style={{ position: "absolute", left: 52, right: 52, top: 386, zIndex: 11, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
            {footer({ size: "md", Icon: open ? X : MailOpen, label: open ? "Cerrar" : "Abrir sobre" })}
          </div>
        </Fit>
      );
    }

    // ── Baraja ──
    case "1e": {
      const cur = Math.min(deck, n - 1);
      const d = info(cards[cur]);
      const go = (dir: number) => { setDeck((k) => (k + dir + n) % n); if (editMode) setSel(null); };
      const arrow = (dir: number, Icon: React.ElementType, label: string) => (
        <span {...keys(() => go(dir))} aria-label={label} onClick={(e) => { e.stopPropagation(); go(dir); }} style={{ width: 40, height: 40, borderRadius: "50%", background: alpha(ink, 0.06), color: ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Icon size={18} />
        </span>
      );
      return wrap(
        <Fit height={440}>
          <span style={{ position: "absolute", left: 0, right: 0, top: 24, textAlign: "center", fontFamily: font, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: alpha(ink, 0.6) }}>{ui.labels.cards} · {cur + 1} / {n}</span>
          {cards.map((_, i) => {
            const pos = (i - cur + n) % n;
            const isFront = pos === 0;
            return (
              <div
                key={i}
                {...keys(() => (editMode ? setSel(sel === i ? null : i) : go(1)))}
                aria-label={brandOf(cards[i]).label}
                onClick={(e) => { e.stopPropagation(); if (!isFront) return; if (editMode) setSel(sel === i ? null : i); else go(1); }}
                style={{ position: "absolute", left: 37, top: 62, width: 300, height: 188, zIndex: n - pos, opacity: pos > 2 ? 0 : 1, transform: reduced ? undefined : `translateY(${pos * 16}px) scale(${1 - pos * 0.06})`, transition: tr(`transform .5s ${EASE}, opacity .4s`), cursor: "pointer", pointerEvents: isFront ? "auto" : "none" }}
              >
                {face({ i, showInfo: editMode && sel === i, sub: <span style={{ fontSize: 12, opacity: 0.85 }}>{info(cards[i]).kind}</span> })}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 24, right: 24, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
            <span style={{ fontFamily: font, fontSize: 13, color: ink, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.value}</span>
            <button type="button" data-edit-row-delete onClick={(e) => { e.stopPropagation(); act(cards[cur]); }} style={{ height: 38, padding: "0 18px", border: "none", borderRadius: 99, background: box, color: onBox, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <d.Icon size={14} />{d.cta}
            </button>
            {n > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                {arrow(-1, ChevronLeft, "Anterior")}
                <div style={{ display: "flex", gap: 6 }}>
                  {cards.map((_, i) => <span key={i} style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 99, background: i === cur ? ink : alpha(ink, 0.2), transition: "width .3s" }} />)}
                </div>
                {arrow(1, ChevronRight, "Siguiente")}
              </div>
            )}
          </div>
        </Fit>
      );
    }

    // ── Girar tarjeta (scroll horizontal) ──
    case "1f":
      return wrap(
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {/* La fila con scroll recorta lo que sale de su caja: lleva aire de
              sobra para la sombra de las tarjetas (y márgenes negativos para
              no crecer el bloque), y se extiende a los lados del bloque. */}
          <div className="scroll-invitation" style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", padding: "24px 24px 32px", margin: "-24px -24px -26px", scrollPadding: "0 24px", justifyContent: n === 1 ? "center" : undefined }}>
            {cards.map((card, i) => {
              const b = brandOf(card);
              const d = info(card);
              const turned = Boolean(flip[i]);
              const tap = () => { setFlip((f) => ({ ...f, [i]: !f[i] })); if (editMode) setSel(turned ? null : i); };
              return (
                <div key={i} {...keys(tap)} aria-label={b.label} onClick={(e) => { e.stopPropagation(); tap(); }} style={{ flex: "none", width: "min(300px, calc(100vw - 80px))", aspectRatio: "300 / 188", perspective: 1000, cursor: "pointer", scrollSnapAlign: "center" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: tr(`transform .6s ${EASE}`), transform: turned && !reduced ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: reduced && turned ? 0 : 1, transition: "opacity .3s" }}>
                      {face({ i, showInfo: false, sub: <span style={{ fontSize: 11.5, opacity: 0.8, display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={12} />{ui.labels.tapToSee ?? "Toca para ver"}</span> })}
                    </div>
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "#FFFFFF", boxShadow: "0 8px 20px rgba(0,0,0,.12)", transform: reduced ? undefined : "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", display: "flex", overflow: "hidden", fontFamily: font, opacity: reduced && !turned ? 0 : 1 }}>
                      <span style={{ width: 10, flex: "none", background: b.bg }} />
                      <div style={{ flex: 1, minWidth: 0, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#787878" }}>{d.kind}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#1B1B1B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.value || b.label}</span>
                        </div>
                        <button type="button" data-edit-row-delete onClick={(e) => { e.stopPropagation(); act(card); }} style={{ alignSelf: "flex-start", height: 32, padding: "0 14px", border: "none", borderRadius: 99, background: b.bg, color: b.fg, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <d.Icon size={13} />{d.cta}
                        </button>
                      </div>
                      {editMode && turned && (
                        <button type="button" className="edit_card_remove" aria-label="Eliminar tarjeta" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeCard(i); }}>
                          <X size={14} strokeWidth={2.6} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {n > 1 && (
            <span style={{ textAlign: "center", fontFamily: font, fontSize: 12, color: alpha(ink, 0.6), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {ui.labels.swipe ?? "Desliza para ver más"}<ArrowRight size={13} />
            </span>
          )}
        </div>
      );

    // ── Caja de regalo ──
    case "1h": {
      const gap = step(88, 44);
      const rot = (i: number) => (n > 1 ? -6 + (12 * i) / (n - 1) : 0);
      const ribbon = accent;
      return wrap(
        // Cerrada se ve desde el moño (y≈240).
        <Fit canvas={470} height={open ? 470 : 470 - 232}>
          {cards.map((_, i) => {
            const isSel = sel === i;
            const top = !open ? 305 : isSel ? 40 : 120 + i * gap + (n === 1 ? 44 : 0);
            const r = open && !isSel ? rot(i) : 0;
            return (
              <div
                key={i}
                {...keys(() => open && setSel(isSel ? null : i))}
                aria-label={brandOf(cards[i]).label}
                onClick={(e) => { e.stopPropagation(); if (open) setSel(isSel ? null : i); }}
                style={{ position: "absolute", left: 77, top, width: 220, height: 138, transformOrigin: "50% 100%", transform: reduced ? undefined : `rotate(${r}deg)`, zIndex: isSel ? 15 : i + 2, transition: tr(`top .6s ${EASE}, transform .6s ${EASE}`), transitionDelay: open && sel === null ? `${0.2 + i * 0.08}s` : "0s", cursor: open ? "pointer" : "default" }}
              >
                {face({ i, showInfo: open && isSel, logoLeft: true, compact: true })}
              </div>
            );
          })}
          {/* Caja */}
          <div style={{ position: "absolute", left: 62, top: 300, width: 251, height: 150, zIndex: 20, borderRadius: "6px 6px 16px 16px", background: `linear-gradient(180deg, ${box} 0%, ${shade(box, -0.1)} 100%)`, boxShadow: "0 12px 26px rgba(0,0,0,.2)", padding: 8, boxSizing: "border-box" }}>
            <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: "linear-gradient(180deg, rgba(0,0,0,.18), transparent)" }} />
            <div style={{ width: "100%", height: "100%", border: `1.5px dashed ${alpha(onBox, 0.35)}`, borderRadius: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, padding: "12px 14px", boxSizing: "border-box" }}>
              {footer({ size: "sm", Icon: open ? X : Gift, label: open ? "Cerrar" : "Abrir regalo" })}
            </div>
          </div>
          {/* Tapa con listón y moño */}
          <div
            {...keys(toggle)}
            aria-label={open ? "Cerrar" : "Abrir regalo"}
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            style={{ position: "absolute", left: 52, top: 270, width: 271, height: 42, zIndex: open ? 1 : 21, borderRadius: 8, background: `linear-gradient(180deg, ${shade(box, 0.1)} 0%, ${shade(box, -0.02)} 100%)`, boxShadow: "0 4px 10px rgba(0,0,0,.18)", display: "flex", justifyContent: "center", transform: open && !reduced ? "translate(0px, -34px) rotate(-6deg)" : "none", transformOrigin: "0 100%", transition: tr(`transform .55s ${EASE}`), cursor: "pointer" }}
          >
            <span style={{ width: 30, height: "100%", background: ribbon }} />
            <span style={{ position: "absolute", left: "50%", top: -22, width: 34, height: 24, marginLeft: -36, border: `6px solid ${ribbon}`, borderRadius: "50% 50% 40% 60%", transform: "rotate(-18deg)", boxSizing: "content-box" }} />
            <span style={{ position: "absolute", left: "50%", top: -22, width: 34, height: 24, marginLeft: 2, border: `6px solid ${ribbon}`, borderRadius: "50% 50% 60% 40%", transform: "rotate(18deg)", boxSizing: "content-box" }} />
            <span style={{ position: "absolute", left: "50%", top: -6, width: 14, height: 12, marginLeft: -7, borderRadius: 4, background: shade(ribbon, -0.3) }} />
          </div>
        </Fit>
      );
    }

    default:
      return null;
  }
}
