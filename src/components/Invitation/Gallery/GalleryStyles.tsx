"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { NewInvitation } from "@/types/new_invitation";
import { useIsSplitColumn } from "../layout/InvitationLayout";

// Catálogo de la Galería (handoff "Galería Catálogo"). El estilo vive en
// gallery.style ("G1" o vacío = la base):
//   G1 Pila → carrusel        G2 Abanico → cuadrícula   G3 Polaroids → lista
//   G4 Rollo de película      G5 Álbum                  G6 Pila → historias
// Todas: cerrado (fotos agrupadas) → tocar → abierto (acomodadas para
// recorrerlas) → tocar → cerrado. Las fotos se mueven físicamente entre las
// dos posiciones. El título lo pone el bloque (Gallery.tsx), no va aquí.
// Sin fondo propio: solo las piezas del diseño (película, álbum) llevan color.
// En el editor tocar la galería abre su barra de imágenes (Gallery.tsx), así
// que aquí no se abre.

export const GALLERY_STYLE_IDS = ["G1", "G2", "G3", "G4", "G5", "G6"] as const;
export type GalleryStyleId = (typeof GALLERY_STYLE_IDS)[number];

const EASE = "cubic-bezier(.2,.8,.2,1)";

const shade = (hex: string, t: number) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex ?? "");
  const n = m ? parseInt(m[1], 16) : 0x999999;
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const reducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Lienzo de 375 px escalado al ancho disponible (transform, no `zoom`:
// Safari). El alto se anima con la misma curva. Con `bleed` (galerías con
// scroll de lado) ocupa todo el ancho de la pantalla (100vw, centrado), sin
// importar el margen del bloque: las fotos se cortan contra la orilla.
function Fit({ height, dur = 0.6, bleed = false, children }: { height: number; dur?: number; bleed?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, width: 375 });
  // En el layout dividido llega hasta la orilla de la columna (sale del
  // relleno de 24px del bloque), no de toda la pantalla.
  const inColumn = useIsSplitColumn();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || 375;
      const scale = Math.min(1, w / 375);
      setBox({ scale, width: bleed ? w / scale : 375 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bleed]);
  return (
    <div ref={ref} style={{ width: bleed ? (inColumn ? "calc(100% + 48px + 2 * var(--zone-pad, 0px))" : "100vw") : "100%", marginLeft: bleed ? (inColumn ? "calc(-24px - var(--zone-pad, 0px))" : "calc(50% - 50vw)") : undefined, height: height * box.scale, position: "relative", transition: `height ${dur}s ${EASE}` }}>
      <div style={{ position: "absolute", left: "50%", top: 0, width: box.width, height, transform: `translateX(-50%) scale(${box.scale})`, transformOrigin: "50% 0", transition: `height ${dur}s ${EASE}` }}>
        {children}
      </div>
    </div>
  );
}

const cover = (src: string): React.CSSProperties => ({ backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" });

export function StyledGallery({ styleId, images, invitation, editMode = false }: {
  styleId: GalleryStyleId;
  images: string[];
  invitation: NewInvitation;
  editMode?: boolean;
}) {
  const n = images.length;
  const g = invitation.generals;
  const primary = g?.colors?.primary ?? "#FFFFFF";
  const secondary = g?.colors?.secondary ?? "#B9AEDD";
  const accent = g?.colors?.accent ?? "#29262D";
  const content = invitation.gallery;
  const ink = content?.inverted ? primary : accent;
  const sans = g?.fonts?.body?.typeFace ?? "Outfit";
  const serif = g?.fonts?.titles?.typeFace ?? sans;
  const names = invitation.cover?.title?.text?.value ?? "";
  const reduced = reducedMotion();
  const t = (s: string) => (reduced ? "opacity .2s" : s);

  const [open, setOpen] = useState(false);
  const [story, setStory] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); setStory(0); }, [styleId]);

  const toggle = () => {
    if (editMode) return;
    if (open) scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    setOpen((o) => !o);
  };
  const press = {
    role: "button" as const,
    tabIndex: editMode ? -1 : 0,
    "aria-expanded": open,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } },
  };
  const hint = (text: string, bottom: number, show = true) => (
    <span style={{ position: "absolute", left: 0, right: 0, bottom, textAlign: "center", fontFamily: sans, fontSize: 12, letterSpacing: 1, color: ink, opacity: show ? 0.7 : 0, transition: "opacity .3s", pointerEvents: "none" }}>{text}</span>
  );

  // G6: teclado (flechas y Esc) con la historia abierta.
  useEffect(() => {
    if (styleId !== "G6" || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") { if (story < n - 1) setStory(story + 1); else setOpen(false); }
      if (e.key === "ArrowLeft") setStory(Math.max(0, story - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [styleId, open, n, story]);

  if (n === 0) return null;

  switch (styleId) {
    // ── Pila → carrusel (base) ──
    // Cerrado: la del frente centrada y dos atrás a ±6°; el resto, oculto
    // detrás. Abierto: fila con scroll de lado y snap, hasta la orilla.
    case "G1": {
      // Aire arriba y abajo: la fila con scroll recorta la sombra y las
      // esquinas de las fotos inclinadas.
      const L = [[0, 24, 0, 10], [-46, 40, -6, 5], [46, 40, 6, 5]];
      const row = 24 * 2 + n * 244 - 14;
      return (
        <Fit height={386} bleed>
          <div ref={scrollRef} className="scroll-invitation" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, overflowX: open ? "auto" : "hidden", overflowY: "hidden", scrollSnapType: open ? "x mandatory" : undefined }}>
            <div {...press} aria-label="Galería" onClick={toggle} style={{ position: "relative", width: open ? row : "100%", minWidth: "100%", height: "100%", cursor: editMode ? undefined : "pointer", transition: t(`width .6s ${EASE}`) }}>
              {images.map((src, i) => {
                const p = L[i] ?? [0, 24, 0, 1];
                const style: React.CSSProperties = open
                  ? { left: 24 + i * 244, top: 32, transform: "rotate(0deg)", zIndex: 1, opacity: 1 }
                  : { left: `calc(50% - 115px + ${p[0]}px)`, top: p[1], transform: `rotate(${p[2]}deg)`, zIndex: p[3], opacity: i < 3 ? 1 : 0 };
                return (
                  <div key={i} role="img" aria-label={`Foto ${i + 1}`} style={{ position: "absolute", width: 230, height: 300, borderRadius: 14, boxShadow: "0 10px 22px rgba(0,0,0,.2)", scrollSnapAlign: "center", transition: t(`left .6s ${EASE}, top .6s ${EASE}, transform .6s ${EASE}, opacity .3s`), ...cover(src), ...style }} />
                );
              })}
            </div>
          </div>
        </Fit>
      );
    }

    // ── Abanico → cuadrícula ──
    case "G2": {
      const fan = Math.min(n, 6);
      const c = (fan - 1) / 2;
      const rows = Math.ceil(n / 2);
      // Cerrado a buen tamaño (como el abanico base): fotos de 210×280.
      const h = open ? 10 + rows * 208 + 10 : 400;
      return (
        <Fit height={h}>
          <div {...press} aria-label="Galería" onClick={toggle} style={{ position: "absolute", inset: 0, cursor: editMode ? undefined : "pointer" }}>
            {images.map((src, i) => {
              const hidden = !open && i >= fan;
              const style: React.CSSProperties = open
                ? { left: 24 + (i % 2) * 167.5, top: 10 + Math.floor(i / 2) * 208, width: 159.5, height: 200, transform: "translateX(0px) rotate(0deg)", zIndex: 1 }
                : { left: 82, top: 24, width: 210, height: 280, transform: `translateX(${(Math.min(i, fan - 1) - c) * 10}px) rotate(${(Math.min(i, fan - 1) - c) * 6}deg)`, zIndex: i + 1 };
              return (
                <div key={i} role="img" aria-label={`Foto ${i + 1}`} style={{ position: "absolute", borderRadius: 12, border: "4px solid #FFFFFF", boxSizing: "border-box", boxShadow: "0 8px 18px rgba(0,0,0,.2)", transformOrigin: "50% 130%", opacity: hidden ? 0 : 1, transition: t(`left .6s ${EASE}, top .6s ${EASE}, width .6s ${EASE}, height .6s ${EASE}, transform .6s ${EASE}, opacity .3s`), ...cover(src), ...style }} />
              );
            })}
            {hint("Toca para ver todas", 22, !open)}
          </div>
        </Fit>
      );
    }

    // ── Polaroids → lista ──
    case "G3": {
      // Cerrado a buen tamaño: polaroids de 250×305.
      const h = open ? 16 + (n - 1) * 320 + 340 : 370;
      return (
        <Fit height={h} dur={0.7}>
          <div {...press} aria-label="Galería" onClick={toggle} style={{ position: "absolute", inset: 0, cursor: editMode ? undefined : "pointer" }}>
            <span style={{ position: "absolute", left: 187, top: 30, width: 1, height: open ? (n - 1) * 320 + 260 : 0, background: ink, opacity: open ? 0.4 : 0, transition: t(`opacity .4s, height .7s ${EASE}`) }} />
            {images.map((src, i) => {
              const k = i % 4;
              const style: React.CSSProperties = open
                ? { left: i % 2 ? 101 : 24, top: 16 + i * 320, width: 250, height: 300, transform: `rotate(${i % 2 ? 3 : -3}deg)` }
                : { left: 62 + [-26, 22, -12, 18][k], top: 20 + [0, 12, -6, 16][k], width: 250, height: 305, transform: `rotate(${[-8, 6, -3, 9][k]}deg)`, opacity: i < 4 ? 1 : 0 };
              return (
                <div key={i} role="img" aria-label={`Foto ${i + 1}`} style={{ position: "absolute", background: "#FFFFFF", padding: "9px 9px 0", display: "flex", flexDirection: "column", boxSizing: "border-box", zIndex: i + 1, boxShadow: "0 10px 22px rgba(0,0,0,.2)", transition: t(`left .7s ${EASE}, top .7s ${EASE}, width .7s ${EASE}, height .7s ${EASE}, transform .7s ${EASE}, opacity .3s`), ...style }}>
                  <div style={{ flex: 1, ...cover(src) }} />
                  <div style={{ height: 40, flex: "none" }} />
                </div>
              );
            })}
          </div>
        </Fit>
      );
    }

    // ── Rollo de película ──
    case "G4": {
      const strip = 20 + n * 130 + (n - 1) * 8;
      const perf = { height: 9, margin: "0 6px", background: "repeating-linear-gradient(90deg, #F5F3F2 0 8px, transparent 8px 16px)", borderRadius: 1, opacity: 0.85 } as const;
      return (
        <Fit height={320} bleed>
          {/* La fila con scroll recorta: lleva aire de sobra arriba y abajo
              para la sombra (0 12px 24px) de la tira. */}
          <div ref={scrollRef} className="scroll-invitation" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 290, overflowX: open ? "auto" : "hidden", overflowY: "hidden" }}>
            {/* Cerrado: la tira centrada; abierto: a lo ancho, pegada a la orilla. */}
            <div style={{ width: open ? strip + 32 : "100%", minWidth: "100%", height: 290, display: "flex", alignItems: "center", justifyContent: open ? "flex-start" : "center", padding: open ? "0 16px" : 0, boxSizing: "border-box", transition: t(`width .7s ${EASE}`) }}>
              <div {...press} aria-label="Rollo de fotos" onClick={toggle} style={{ flex: "none", width: open ? strip : 290, height: 214, background: "#1B1B1B", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "8px 0", boxSizing: "border-box", transform: open || reduced ? "rotate(0deg)" : "rotate(-4deg)", boxShadow: "0 12px 24px rgba(0,0,0,.25)", transition: t(`width .7s ${EASE}, transform .7s ${EASE}`), cursor: editMode ? undefined : "pointer" }}>
                <span style={perf} />
                <div style={{ display: "flex", gap: 8, padding: "0 10px" }}>
                  {images.map((src, i) => <div key={i} role="img" aria-label={`Foto ${i + 1}`} style={{ flex: "none", width: 130, height: 164, borderRadius: 2, ...cover(src) }} />)}
                </div>
                <span style={perf} />
              </div>
            </div>
          </div>
          {hint(open ? "Desliza · toca para enrollar" : "Toca para desenrollar", 10)}
        </Fit>
      );
    }

    // ── Álbum ──
    case "G5": {
      const cloth = shade(secondary, -0.08);
      const onCloth = primary;
      return (
        <Fit height={414} bleed>
          {/* Páginas */}
          <div ref={scrollRef} className="scroll-invitation" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 370, overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", opacity: open ? 1 : 0, transition: "opacity .4s", transitionDelay: open ? "0.35s" : "0s", pointerEvents: open ? "auto" : "none" }}>
            {/* La primera página centrada; el resto se corta con la orilla. */}
            <div style={{ display: "flex", gap: 14, padding: "10px calc(50% - 130px)", width: "max-content", minWidth: "100%", boxSizing: "border-box" }}>
              {images.map((src, i) => (
                <div key={i} {...press} aria-label={`Página ${i + 1}`} onClick={toggle} style={{ flex: "none", width: 260, height: 340, background: "#FFFDF8", padding: "14px 14px 40px", boxSizing: "border-box", boxShadow: "0 8px 18px rgba(0,0,0,.15)", scrollSnapAlign: "center", cursor: "pointer", position: "relative" }}>
                  <div style={{ width: "100%", height: "100%", ...cover(src) }} />
                  <span style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontFamily: serif, fontStyle: "italic", fontSize: 15, color: shade(cloth, -0.35) }}>— {i + 1} —</span>
                </div>
              ))}
            </div>
          </div>
          {/* Portada de tela */}
          <div {...press} aria-label="Abrir álbum" onClick={toggle} style={{ position: "absolute", left: "calc(50% - 130px)", top: 8, width: 260, height: 350, borderRadius: "4px 16px 16px 4px", background: `linear-gradient(135deg, ${shade(cloth, 0.12)}, ${cloth})`, boxShadow: "0 14px 30px rgba(0,0,0,.25), inset 6px 0 0 rgba(0,0,0,.08)", transformOrigin: "0 50%", transform: open && !reduced ? "perspective(1400px) rotateY(-100deg)" : "perspective(1400px) rotateY(0deg)", opacity: open ? 0 : 1, transition: t(`transform .7s ${EASE}, opacity .35s`), transitionDelay: open ? "0s" : "0.15s", pointerEvents: open ? "none" : "auto", cursor: editMode ? undefined : "pointer", padding: 14, boxSizing: "border-box" }}>
            <div style={{ width: "100%", height: "100%", border: `1px solid ${onCloth}80`, borderRadius: "2px 10px 10px 2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, boxSizing: "border-box", padding: "0 10px" }}>
              <div style={{ width: 130, height: 160, background: "#FFFFFF", padding: 6, boxShadow: "inset 0 2px 4px rgba(0,0,0,.15)", boxSizing: "border-box" }}>
                <div style={{ width: "100%", height: "100%", ...cover(images[0]) }} />
              </div>
              {content?.title && <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 26, color: onCloth, textAlign: "center", lineHeight: 1.1 }}>{content.title}</span>}
              {names && <span style={{ fontFamily: sans, fontSize: 11, letterSpacing: 3, color: onCloth, opacity: 0.85, textTransform: "uppercase", textAlign: "center" }}>{names}</span>}
            </div>
          </div>
          {hint(open ? "Desliza las páginas · toca para cerrar" : "Toca para abrir el álbum", 14)}
        </Fit>
      );
    }

    // ── Pila → historias ──
    case "G6": {
      const cur = Math.min(story, n - 1);
      const next = () => (cur < n - 1 ? setStory(cur + 1) : setOpen(false));
      const prev = () => setStory(Math.max(0, cur - 1));
      // Cerrado a buen tamaño: fotos de 250×350.
      const L = [[62, 16, 0, 10], [22, 34, -7, 5], [102, 34, 7, 5]];
      return (
        <Fit height={open ? 652 : 460}>
          {images.slice(0, 3).map((src, i) => {
            const front = i === 0;
            const style: React.CSSProperties = open && front
              ? { left: 16, top: 16, width: 343, height: 620, transform: "rotate(0deg)", zIndex: 20, opacity: 1, ...cover(images[cur]) }
              : { left: L[i][0], top: L[i][1], width: 250, height: 350, transform: `rotate(${L[i][2]}deg)`, zIndex: L[i][3], opacity: open ? 0 : 1, ...cover(src) };
            return (
              <div
                key={i}
                {...(front ? press : {})}
                aria-label={front ? "Ver historia" : undefined}
                onClick={front && !open ? toggle : undefined}
                style={{ position: "absolute", borderRadius: 18, boxShadow: "0 12px 26px rgba(0,0,0,.35)", overflow: "hidden", transition: t(`left .6s ${EASE}, top .6s ${EASE}, width .6s ${EASE}, height .6s ${EASE}, transform .6s ${EASE}, opacity .3s`), cursor: editMode || open ? undefined : "pointer", ...style }}
              />
            );
          })}
          {open && (
            <div style={{ position: "absolute", left: 16, top: 16, width: 343, height: 620, zIndex: 40, borderRadius: 18, overflow: "hidden" }}>
              <span style={{ position: "absolute", inset: "0 0 auto 0", height: 90, background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent)" }} />
              <div style={{ position: "absolute", left: 12, right: 12, top: 12, display: "flex", gap: 4 }}>
                {images.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= cur ? "#FFFFFF" : "rgba(255,255,255,.35)" }} />)}
              </div>
              <div style={{ position: "absolute", left: 12, right: 12, top: 24, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#FFFFFF" }}>
                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>{names ? `${names} · ` : ""}{cur + 1}/{n}</span>
                <button type="button" aria-label="Cerrar" onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ width: 34, height: 34, border: "none", borderRadius: "50%", background: "rgba(0,0,0,.25)", color: "#FFFFFF", display: "grid", placeItems: "center", cursor: "pointer", position: "relative", zIndex: 2 }}><X size={17} /></button>
              </div>
              <div aria-label="Anterior" onClick={prev} style={{ position: "absolute", left: 0, top: 70, bottom: 0, width: "40%", cursor: "w-resize" }} />
              <div aria-label="Siguiente" onClick={next} style={{ position: "absolute", right: 0, top: 70, bottom: 0, width: "60%", cursor: "e-resize" }} />
            </div>
          )}
          <span style={{ position: "absolute", left: 0, right: 0, bottom: 24, textAlign: "center", opacity: open ? 0 : 1, transition: "opacity .3s", pointerEvents: open ? "none" : "auto" }}>
            <span onClick={editMode ? undefined : toggle} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 99, background: secondary, color: primary, fontFamily: sans, fontSize: 12.5, fontWeight: 600, cursor: editMode ? undefined : "pointer" }}>
              <Play size={13} />Ver historia
            </span>
          </span>
        </Fit>
      );
    }

    default:
      return null;
  }
}
