"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { darker } from "@/helpers/functions";
import { Cover } from "@/components/Invitation/Cover/Cover";
import { AddToCalendar } from "@/components/AddToCalendar/AddToCalendar";
import Reactions from "./Reactions";
import { CoverSection, Font, Generals, NewInvitation } from "@/types/new_invitation";
import styles from "./save-the-date.module.css";

// El cover del Save the Date extiende al de la invitación con la tipografía
// del countdown (cover.date.typeFace) — vive solo en save_the_dates.cover.
type StdDate = CoverSection["date"] & { typeFace?: string | null };
type StdCover = Omit<CoverSection, "date"> & { date: StdDate };

type SaveTheDateProps = {
  cover: Partial<StdCover> | null;
  eventDate: string | null; // timestamptz de save_the_dates.event_date (fuente de verdad del countdown)
  saveTheDateId?: string | null; // null en el preview del editor: reacciones sin persistir
};

const DEFAULT_COVER: StdCover = {
  title: {
    text: {
      value: "Save the date",
      size: 42,
      weight: 600,
      opacity: 1,
      typeFace: "Poppins",
      color: "#FFFFFF",
    },
    position: {
      column_reverse: "column",
      align_x: "center",
      align_y: "center",
    },
  },
  date: { value: "", active: true, color: "#FFFFFF", type: null, typeFace: null },
  song: null,
  image: {
    prod: null,
    dev: null,
    background: true,
    blur: false,
    position: { x: 0, y: 0 },
    zoom: 1,
  },
};

const DEFAULT_GENERALS: Generals = {
  colors: {
    primary: "#16323d",
    secondary: "#F5F3F2",
    accent: "#F5F3F2",
    actions: "#D1BEDD",
  },
  fonts: {},
  event: { label: null, name: null },
  separator: 0,
  positions: [],
  texture: null,
};

// Look "liquid glass" del CTA (mismo recipe que el reproductor de música comprimido)
const GLASS_BUTTON: React.CSSProperties = {
  minHeight: "44px",
  borderRadius: "99px",
  padding: "0 18px",
  border: "1px solid rgba(255, 255, 255, 0.45)",
  background: "rgba(255, 255, 255, 0.42)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1.5px 0 rgba(255, 255, 255, 0.65), inset 0 -1px 0 rgba(255, 255, 255, 0.15)",
  color: "#111",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  letterSpacing: "0.5px",
};

// La fila puede traer un `cover` parcial (insertado a mano o desde el editor);
// rellenamos la forma completa que Cover.tsx espera para no reventar en runtime.
function normalizeCover(raw: Partial<StdCover> | null, eventDate: string | null): StdCover {
  const c = raw ?? {};
  return {
    title: {
      text: { ...DEFAULT_COVER.title.text, ...(c.title?.text ?? {}) },
      position: { ...DEFAULT_COVER.title.position, ...(c.title?.position ?? {}) },
    },
    date: {
      ...DEFAULT_COVER.date,
      ...(c.date ?? {}),
      // event_date (columna propia) manda sobre la copia de cover.date.value
      ...(eventDate ? { value: eventDate } : {}),
    },
    song: c.song ?? null,
    image: { ...DEFAULT_COVER.image, ...(c.image ?? {}) },
  };
}

export default function SaveTheDate({ cover, eventDate, saveTheDateId = null }: SaveTheDateProps) {
  const normalized = normalizeCover(cover, eventDate);
  const [activeIdx, setActiveIdx] = useState(0);
  // Con mensajes guardados, el cover reserva espacio extra para el ticker
  const [hasMessages, setHasMessages] = useState(false);

  // CountDown lee la fuente de generals.fonts.body.typeFace — ahí mapeamos
  // la tipografía elegida para el countdown.
  const countdownFont: Font | undefined = normalized.date.typeFace
    ? {
        value: null,
        size: 16,
        weight: 400,
        opacity: 1,
        typeFace: normalized.date.typeFace,
        color: normalized.date.color ?? "#FFFFFF",
      }
    : undefined;

  // Cover solo consume { cover, generals } — el resto de NewInvitation no se toca.
  // Va SIN imágenes ni overlays y con fondo transparente: el carrusel completo
  // vive en la capa fija de atrás y el Cover solo pone título + countdown.
  const invitation = {
    cover: {
      ...normalized,
      image: { ...normalized.image, prod: [], dev: null, background: false, blur: false },
    },
    generals: {
      ...DEFAULT_GENERALS,
      colors: { ...DEFAULT_GENERALS.colors, primary: "transparent" },
      fonts: countdownFont ? { body: countdownFont } : {},
    },
  } as unknown as NewInvitation;

  const rawDate = eventDate ?? normalized.date.value;
  // Fechas absolutas de la plataforma: solo la parte YYYY-MM-DD, sin timezone.
  const startDate = rawDate ? rawDate.slice(0, 10) : null;
  const eventName = normalized.title.text.value?.trim() || "Save the date";

  // El carrusel vive COMPLETO en esta capa fija al viewport; el Cover recibe
  // cero imágenes y fondo transparente, así el título/countdown/botón se
  // deslizan por encima de la imagen fija y nunca hay costura ni hueco.
  const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
  const prod = normalized.image.prod;
  const mediaList = typeof prod === "string" ? [prod] : Array.isArray(prod) ? prod : [];
  const mediaItems = mediaList.filter((s) => typeof s === "string" && !!s.trim());
  const isCarousel = mediaItems.length > 1;

  useEffect(() => {
    if (activeIdx >= mediaItems.length && mediaItems.length > 0) setActiveIdx(0);
  }, [mediaItems.length, activeIdx]);

  useEffect(() => {
    if (!isCarousel) return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % mediaItems.length), 4500);
    return () => clearInterval(id);
  }, [isCarousel, mediaItems.length]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: DEFAULT_GENERALS.colors.primary ?? "#16323d" }}>
      {mediaItems.length > 0 && (
        <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              filter: normalized.image.blur && !normalized.image.background ? "blur(6px)" : undefined,
            }}
          >
            {mediaItems.map((src, i) => (
              <div
                key={src + i}
                style={{ position: "absolute", inset: 0, opacity: i === activeIdx ? 1 : 0, transition: "opacity 0.9s ease" }}
              >
                {isVideo(src) ? (
                  <video
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Image fill alt="" src={src} sizes="100vw" quality={100} priority={i === 0} style={{ objectFit: "cover" }} />
                )}
              </div>
            ))}
          </div>
          {normalized.image.background && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${darker(DEFAULT_GENERALS.colors.primary ?? "#16323d", 0.2)}, transparent)`,
                mixBlendMode: "multiply",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      )}

      <div className={`${styles.coverShell} ${hasMessages ? styles.coverShellTicker : ""}`} style={{ position: "relative" }}>
        <Cover dev={false} invitation={invitation} height="100dvh" />

        {/* Dots del carrusel (el Cover ya no dibuja media) */}
        {isCarousel && (
          <div className={styles.dots}>
            {mediaItems.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ""}`}
                onClick={() => setActiveIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA glass fijo arriba, sobre el cover */}
      {startDate && (
        <div className={styles.ctaFixed}>
          <AddToCalendar
            name={eventName}
            startDate={startDate}
            primary="#16323d"
            accent="#F5F3F2"
            label="Save the date"
            buttonStyle={GLASS_BUTTON}
            menuClassName={styles.glassMenu}
            placement="bottomRight"
          />
        </div>
      )}

      {/* Reacciones estilo historia de Instagram */}
      <Reactions saveTheDateId={saveTheDateId} onMessagesChange={setHasMessages} />
    </div>
  );
}
