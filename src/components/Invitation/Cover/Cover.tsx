"use client";

import { lighter } from "@/helpers/functions";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { forwardRef } from "react";
import styles from "./cover.module.css";
import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import Countdown from "./countDown/CountDown";
import { blurStyle, shadowBackground } from "./coverEffects";
import { EditableText } from "../EditableText";
import { Type, ImagePlus } from "lucide-react";
import { useScreenWidth } from "@/hooks/useScreenWidth";

type CoverProps = {
  dev: boolean;
  invitation: NewInvitation | null;
  height: string | number;
  validated?: boolean;
  ui?: InvitationUIBundle | null;
  lang?: string | null;
  // "aside": panel izquierdo fijo del layout web (≥768).
  variant?: "full" | "aside";
  // Solo en "aside": lo que va arriba del título (reproductor de la canción).
  topSlot?: React.ReactNode;
  // Solo en "aside": reserva el espacio inferior donde flota el dock.
  reserveDock?: boolean;
  // Layout móvil de la invitación: la portada mide lo mismo que el área de la
  // invitación (min-height 110vmax en invitation.module.css), que en Safari
  // llega hasta abajo de la pantalla, detrás de su barra. Título y contador se
  // acomodan solo en la parte visible (100dvh) para que la barra no los tape.
  bleed?: boolean;
  // Modo edición (ver Invitation.tsx): el título se escribe directo encima y
  // se arrastra; título y fecha se tocan para abrir su control en el editor.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onSelectField?: (_field: "title" | "date" | null) => void; // null = se soltó
  // Botón de herramienta pegado al bloque (hoy: tipografía del título). Manda
  // su posición dentro de la pieza para que el editor abra el popover ahí.
  onFieldTool?: (_field: "title" | "date" | "cover_media", _rect: { x: number; y: number; w: number; h: number }) => void;
};

// Cuadrantes del título (modo edición): la misma retícula 3×3 del panel de
// Portada (align_x × align_y). Arrastrar el asa o tocar un cuadrante lo
// acomoda ahí; no hay posición libre.
const ALIGN_X = ["left", "center", "right"] as const;
const ALIGN_Y = ["flex-start", "center", "flex-end"] as const;
type Cell = { col: number; row: number };

const cellFromPointer = (clientX: number, clientY: number, box: DOMRect): Cell => ({
  col: Math.min(2, Math.max(0, Math.floor(((clientX - box.left) / box.width) * 3))),
  row: Math.min(2, Math.max(0, Math.floor(((clientY - box.top) / box.height) * 3))),
});

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

const toArray = (src: string | string[] | null | undefined): string[] => {
  if (!src) return [];
  if (typeof src === 'string') return src.trim() ? [src] : [];
  if (Array.isArray(src)) return src.filter((s): s is string => typeof s === 'string' && !!s.trim());
  return []; // guard against unexpected JSONB objects
};

export const Cover = forwardRef<HTMLDivElement, CoverProps>(function Cover(
  { ui, lang, dev, invitation, height: _height, validated = true, variant = "full", topSlot, reserveDock = false, bleed = false, editMode = false, onFieldChange, onSelectField, onFieldTool },
  ref
) {
  const cover = invitation?.cover;
  const generals = invitation?.generals;

  // Modo edición: título y fecha son bloques que se tocan y se arrastran
  // (como en los Eventos Flash). Un toque elige el bloque; arrastrarlo lo
  // lleva a un cuadrante (título: la retícula 3×3 del panel; fecha: arriba o
  // abajo del título); con el título ya elegido, otro toque entra a escribir.
  type Block = "title" | "date";
  const [selectedField, setSelectedField] = useState<Block | null>(null);
  const [dragKind, setDragKind] = useState<Block | null>(null);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; kind: Block; moved: boolean } | null>(null);
  // Copia del elegido para los listeners del documento (closures viejas).
  const selectedRef = useRef<Block | null>(null);
  selectedRef.current = selectedField;
  const onSelectFieldRef = useRef(onSelectField);
  onSelectFieldRef.current = onSelectField;

  useEffect(() => { if (!editMode) setSelectedField(null); }, [editMode]);

  // Tocar fuera de los bloques (el fondo, otro módulo) los deselecciona y
  // cierra la escritura del título.
  useEffect(() => {
    if (!editMode) return;
    const release = () => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      if (selectedRef.current === null) return;
      setSelectedField(null);
      onSelectFieldRef.current?.(null); // el editor esconde el botón del título
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-edit-sub]")) return;
      release();
    };
    const onDeselect = () => release();
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("iattend-edit-deselect", onDeselect);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("iattend-edit-deselect", onDeselect);
    };
  }, [editMode]);

  const currentCell: Cell = {
    col: Math.max(0, ALIGN_X.indexOf(cover?.title.position.align_x ?? "center")),
    row: Math.max(0, ALIGN_Y.indexOf(cover?.title.position.align_y ?? "center")),
  };
  const dateOnTop = cover?.title.position.column_reverse === "column-reverse";
  const slotFromPointer = (clientY: number, box: DOMRect) => (clientY - box.top < box.height / 2 ? 0 : 1);

  // Un solo cambio con la posición completa (no un mensaje por eje).
  const placeTitle = (cell: Cell) => {
    if (!cover) return;
    onFieldChange?.("cover.title.position", { ...cover.title.position, align_x: ALIGN_X[cell.col], align_y: ALIGN_Y[cell.row] });
  };
  const placeDate = (slot: number) => {
    if (!cover) return;
    onFieldChange?.("cover.title.position", { ...cover.title.position, column_reverse: slot === 0 ? "column-reverse" : "column" });
  };

  const fieldOf = (el: HTMLElement) => el.querySelector<HTMLElement>("[data-edit-field]");

  const onBlockDown = (kind: Block) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editMode) return;
    // Escribiendo: el puntero es del texto (caret, selección), no del arrastre.
    const field = fieldOf(e.currentTarget);
    if (field && document.activeElement === field) return;
    // Tocar otro bloque cierra la escritura del título.
    (document.activeElement as HTMLElement | null)?.blur?.();
    e.preventDefault(); // sin esto el toque enfoca el texto y arranca una selección
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { x: e.clientX, y: e.clientY, kind, moved: false };
  };

  const onBlockMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.moved) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
      p.moved = true;
      setSelectedField(p.kind);
      setDragKind(p.kind);
    }
    if (p.kind === "title") {
      const box = gridRef.current?.getBoundingClientRect();
      if (box) setHoverCell(cellFromPointer(e.clientX, e.clientY, box));
    } else {
      const box = slotsRef.current?.getBoundingClientRect();
      if (box) setHoverSlot(slotFromPointer(e.clientY, box));
    }
  };

  const onBlockUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (p.moved) {
      if (p.kind === "title") {
        const box = gridRef.current?.getBoundingClientRect();
        if (box) placeTitle(cellFromPointer(e.clientX, e.clientY, box));
      } else {
        const box = slotsRef.current?.getBoundingClientRect();
        if (box) placeDate(slotFromPointer(e.clientY, box));
      }
      setDragKind(null);
      setHoverCell(null);
      setHoverSlot(null);
      return;
    }
    // Toque sin arrastre: elige el bloque; si ya estaba elegido el título,
    // entra a escribir (caret al final). La fecha abre (o cierra, al volver a
    // tocarla) su panel en el editor: día, color y ocultar.
    if (p.kind === "date") {
      const r = e.currentTarget.getBoundingClientRect();
      if (selectedField !== "date") {
        setSelectedField("date");
        onSelectField?.("date");
      }
      onFieldTool?.("date", { x: r.left, y: r.top, w: r.width, h: r.height });
      return;
    }
    if (selectedField !== p.kind) {
      setSelectedField(p.kind);
      onSelectField?.(p.kind);
      return;
    }
    if (p.kind === "title") {
      const field = fieldOf(e.currentTarget);
      if (!field) return;
      field.focus();
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };


  const rawSrc = dev ? cover?.image.dev : cover?.image.prod;
  const mediaItems = toArray(rawSrc);
  const isCarousel = mediaItems.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= mediaItems.length) setActiveIndex(0);
  }, [mediaItems.length, activeIndex]);

  useEffect(() => {
    if (!isCarousel) return;
    const id = setInterval(
      () => setActiveIndex((i) => (i + 1) % mediaItems.length),
      4500
    );
    return () => clearInterval(id);
  }, [isCarousel, mediaItems.length]);

  const width = useScreenWidth();
  const isLargeScreen = width >= 768;

  const renderSlides = () =>
    mediaItems.map((src, i) => (
      <div
        key={src + i}
        className={styles.carouselSlide}
        style={{ opacity: i === activeIndex ? 1 : 0 }}
      >
        <div className={styles.carouselInner}>
          {isVideo(src) ? (
            <video src={src} autoPlay muted loop playsInline className={styles.carouselVideo} />
          ) : (
            <Image
              fill
              priority={i === 0}
              quality={100}
              sizes={variant === "aside" ? "42vw" : "100vw"}
              style={{ objectFit: "cover" }}
              alt=""
              src={src}
            />
          )}
        </div>
      </div>
    ));

  if (variant === "aside") {
    return (
      <div ref={ref} className={styles.aside_cover} style={{ background: generals?.colors.primary ?? "#FFFFFF" }}>
        {mediaItems.length > 0 && (
          <div className={styles.aside_media} style={{ transform: `scale(${cover?.image.zoom ?? 1})` }}>
            {renderSlides()}
          </div>
        )}

        {cover?.image.background ? (
          <div
            className={styles.aside_overlay}
            style={{ background: shadowBackground(cover.image.shadow_settings, generals?.colors.primary ?? "#FFFFFF") }}
          />
        ) : (
          cover?.image.blur && <div className={styles.blur_cover} style={blurStyle(cover.image.blur_settings)} />
        )}

        {isCarousel && (
          <div className={`${styles.carouselDots} ${styles.aside_dots}`}>
            {mediaItems.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        <div className={styles.aside_content}>
          <div className={styles.aside_top}>
            {topSlot}
            <span
              translate="no"
              className={`notranslate ${styles.aside_title}`}
              style={{
                color: cover?.title.text.color ?? lighter(generals?.colors.accent ?? "#000000", 0.6) ?? "#FFFFFF",
                opacity: cover?.title.text.opacity,
                fontFamily: cover?.title.text.typeFace,
                fontWeight: cover?.title.text.weight,
              }}
            >
              {cover?.title.text.value}
            </span>
          </div>

          <div className={styles.aside_bottom}>
            {cover?.date.active && (
              <Countdown ui={ui} locale={lang} cover={cover} generals={generals} dev={dev} validated={validated} variant="aside" />
            )}
            {reserveDock && <div className={styles.aside_dock_space} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={styles.module_cover_container} style={{ position: "relative", zIndex: 10, ...(bleed ? { height: "110vmax" } : {}) }}>
      <div
        className={!dev ? styles.cover_container : styles.cover_container_dev}
        data-cover-box
        style={{ padding: "0", background: generals?.colors.primary ?? "#FFFFFF", position: "relative" }}
      >
        {/* ── Media (single or carousel) ── */}
        {mediaItems.length > 0 && (
          <div
            className={styles.cover_image_container}
            style={{
              top: "0px",
              left: "0px",
              transform: `scale(${cover?.image.zoom ?? 1})`,
              position: "relative",
            }}
          >
            {renderSlides()}
          </div>
        )}

        {/* ── Carousel dots ── */}
        {isCarousel && (
          <div className={styles.carouselDots}>
            {mediaItems.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Overlays ── */}
        {cover?.image.background ? (
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: "0px",
              right: "0px",
              background: shadowBackground(cover.image.shadow_settings, generals?.colors.primary ?? "#FFFFFF"),
              pointerEvents: "none",
              mixBlendMode: "multiply",
            }}
          />
        ) : (
          cover?.image.blur && <div className={styles.blur_cover} style={blurStyle(cover.image.blur_settings)} />
        )}

        {/* "Cambiar fondo" en el modo edición: va dentro de la portada, así se
            queda pegado a la imagen al hacer scroll. Si el título está en la
            fila del centro, sube para no taparlo. */}
        {editMode && (
          <button
            type="button"
            className="edit_center_btn edit_center_btn--always"
            data-edit-hit
            data-edit-sub="media"
            style={currentCell.row === 1 ? { top: "18%" } : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              onFieldTool?.("cover_media", { x: r.left, y: r.top, w: r.width, h: r.height });
            }}
          >
            <ImagePlus size={14} />
            Cambiar fondo
          </button>
        )}

        {/* ── Title + countdown ── */}
        <div
          className={styles.background_cover}
          style={{ flexDirection: cover?.title.position.column_reverse ?? "column", ...(bleed ? { height: "100dvh" } : {}) }}
        >
          {/* Ranuras de la fecha (arriba / abajo del título), con la fecha elegida. */}
          {editMode && selectedField === "date" && cover?.date.active && (
            <div ref={slotsRef} className={styles.editSlots} data-dragging={dragKind === "date" || undefined}>
              {[0, 1].map((slot) => (
                <div
                  key={slot}
                  className={styles.editCell}
                  data-current={(dateOnTop ? 0 : 1) === slot || undefined}
                  data-hover={hoverSlot === slot || undefined}
                />
              ))}
            </div>
          )}
          <div
            className={styles.cover_title_container}
            style={{
              alignItems: cover?.title.position.align_y,
              height: cover?.date.active ? "75%" : "100%",
              padding: cover?.date.active ? 0 : "10px",
              position: "relative",
            }}
          >
            {/* Cuadrantes: se ven con el título elegido; tocar uno lo acomoda
                ahí y, al arrastrar el asa, se marca el que está debajo. */}
            {editMode && selectedField === "title" && (
              <div ref={gridRef} className={styles.editGrid} data-dragging={dragKind === "title" || undefined}>
                {Array.from({ length: 9 }, (_, i) => {
                  const cell = { col: i % 3, row: Math.floor(i / 3) };
                  const isCurrent = cell.col === currentCell.col && cell.row === currentCell.row;
                  const isHover = hoverCell?.col === cell.col && hoverCell?.row === cell.row;
                  return (
                    <div
                      key={i}
                      className={styles.editCell}
                      data-current={isCurrent || undefined}
                      data-hover={isHover || undefined}
                    />
                  );
                })}
              </div>
            )}
            {/* El marco y el asa abrazan solo el bloque del texto, no todo el
                contenedor de alineación. */}
            <div
              className={`${styles.titleBlock} ${editMode ? styles.editBlock : ""}`}
              data-edit-hit={editMode || undefined}
              data-edit-sub="title"
              data-selected={selectedField === "title" || undefined}
              data-dragging={dragKind === "title" || undefined}
              onPointerDown={editMode ? onBlockDown("title") : undefined}
              onPointerMove={editMode ? onBlockMove : undefined}
              onPointerUp={editMode ? onBlockUp : undefined}
              onPointerCancel={editMode ? onBlockUp : undefined}
              onClick={editMode ? (e) => e.stopPropagation() : undefined}
              onDragStart={editMode ? (e) => e.preventDefault() : undefined}
            >
            {editMode && selectedField === "title" && (
              <button
                type="button"
                className={styles.fieldTool}
                data-edit-hit
                aria-label="Tipografía del título"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  onFieldTool?.("title", { x: r.left, y: r.top, w: r.width, h: r.height });
                }}
              >
                <Type size={15} strokeWidth={2.4} />
              </button>
            )}
            <EditableText
              path="cover.title.text.value"
              value={cover?.title.text.value ?? ""}
              editMode={editMode}
              onFieldChange={onFieldChange}
              className="notranslate"
              style={{
                display: "block",
                color: cover?.title.text.color ?? lighter(generals?.colors.accent ?? "#000000", 0.6) ?? "#FFFFFF",
                width: "100%",
                textAlign: cover?.title.position.align_x,
                fontSize: `${(cover?.title.text.size ?? 0) + (isLargeScreen ? 30 : 0)}px`,
                wordBreak: "break-word",
                opacity: cover?.title.text.opacity,
                fontFamily: cover?.title.text.typeFace,
                fontWeight: cover?.title.text.weight,
                lineHeight: "1",
                textShadow: "0px 0px 8px rgba(0, 0, 0, 0.5)",
                minWidth: "250px",
              }}
            />
            </div>
          </div>

          {cover?.date.active && (
            <div
              style={{
                width: "100%",
                backgroundColor: "transparent",
                height: "25%",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "250px",
                position: "relative",
              }}
            >
              <div
                className={editMode ? styles.editBlock : undefined}
                data-edit-hit={editMode || undefined}
                data-edit-sub="date"
                data-selected={selectedField === "date" || undefined}
                data-dragging={dragKind === "date" || undefined}
                onPointerDown={editMode ? onBlockDown("date") : undefined}
                onPointerMove={editMode ? onBlockMove : undefined}
                onPointerUp={editMode ? onBlockUp : undefined}
                onPointerCancel={editMode ? onBlockUp : undefined}
                onClick={editMode ? (e) => e.stopPropagation() : undefined}
                onDragStart={editMode ? (e) => e.preventDefault() : undefined}
              >
                <Countdown ui={ui} locale={lang} cover={cover} generals={generals} dev={dev} validated={validated} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
