import { NewInvitation } from "@/types/new_invitation";
import { fontExtras } from "../fontExtras";
import { ModuleBackdrop, moduleBoxExtras } from "../ModuleBackdrop";
import Image from "next/image";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { ImagePlus, Type } from "lucide-react";
import FadeIn from "@/components/Motion/FadeIn";
import { darker } from "@/helpers/functions";
import styles from "./quote.module.css";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import { EditableText } from "../EditableText";
import { blurStyle, shadowBackground, type BlurSettings, type ShadowSettings } from "../Cover/coverEffects";

type quoteProps = {
  dev: boolean;
  invitation: NewInvitation;
  // Modo edición (ver Invitation.tsx): los textos se escriben directo encima.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
  // Se soltó el texto elegido sin elegir otra cosa (el editor cierra su "T").
  onClearField?: () => void;
  textBar?: boolean; // el editor muestra su barra de texto: sin la "T"
  onSelectText?: () => void; // se eligió el texto de la Cita (el editor abre su barra de texto)
};

// Cuadrantes del texto sobre la imagen: los mismos 3×3 que el panel de Cita
// (BuildQuote) y que el título de la portada. x = text.justify, y = text.align.
const JUSTIFY = ["left", "center", "right"] as const;
const ALIGN = ["flex-start", "center", "flex-end"] as const;
const JUSTIFY_FLEX = { left: "flex-start", center: "center", right: "flex-end" } as const;
type Cell = { col: number; row: number };
const cellFromPointer = (x: number, y: number, box: DOMRect): Cell => ({
  col: Math.min(2, Math.max(0, Math.floor(((x - box.left) / box.width) * 3))),
  row: Math.min(2, Math.max(0, Math.floor(((y - box.top) / box.height) * 3))),
});

export const Quote = forwardRef<HTMLDivElement, quoteProps>(function Quote({ dev, invitation, editMode = false, textBar = false, onFieldChange, onFieldTool, onClearField, onSelectText }, ref) {
  const content = invitation.quote;
  const generals = invitation.generals;

  const image_src = dev ? content.image.dev : content.image.prod;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  // Fondo del módulo: su color propio si lo tiene, si no el secundario del
  // tema. Solo para el fondo; botones y bordes siguen con el del tema.
  const moduleBg = content?.dynamic_background?.custom_color || secondary;
  const accent = generals?.colors.accent ?? "#FFFFFF";

  const hasQuoteContent = content.image.active || Boolean(content.text.font.value?.trim());

  // Efectos de la imagen como los de la portada (ver coverEffects.ts). Datos
  // viejos solo traen text.shadow: sin `background`/`blur` en la imagen se
  // dibuja la sombra de siempre.
  const img = content.image as typeof content.image & {
    background?: boolean; blur?: boolean;
    shadow_settings?: ShadowSettings | null; blur_settings?: BlurSettings | null;
  };
  const imageFx = {
    custom: img.background !== undefined || img.blur !== undefined,
    shadow: Boolean(img.background),
    blur: Boolean(img.blur),
    shadowSettings: img.shadow_settings,
    blurSettings: img.blur_settings,
  };

  // ── Texto sobre la imagen en modo edición ──
  // Igual que el título de la portada: el primer toque lo elige (aparecen los
  // cuadrantes y la "T" de su tipografía), arrastrarlo lo acomoda en otro
  // cuadrante y otro toque entra a escribir.
  const [textSelected, setTextSelected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const press = useRef<{ x: number; y: number; moved: boolean; wasSelected: boolean } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(false);
  selectedRef.current = textSelected;
  const onClearRef = useRef(onClearField);
  onClearRef.current = onClearField;
  // Al elegir el texto se avisa al editor (abre su barra de texto); al
  // soltarlo, `release` ya manda onClearField.
  const onSelectTextRef = useRef(onSelectText);
  onSelectTextRef.current = onSelectText;
  useEffect(() => {
    if (editMode && textSelected) onSelectTextRef.current?.();
  }, [editMode, textSelected]);
  const currentCell: Cell = {
    col: Math.max(0, JUSTIFY.indexOf(content.text.justify ?? "center")),
    row: Math.max(0, ALIGN.indexOf(content.text.align ?? "center")),
  };

  useEffect(() => {
    if (!editMode) return;
    const release = () => {
      if (!selectedRef.current) return;
      (document.activeElement as HTMLElement | null)?.blur?.();
      setTextSelected(false);
      onClearRef.current?.();
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-quote-block]")) return;
      release();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("iattend-edit-deselect", release);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("iattend-edit-deselect", release);
    };
  }, [editMode]);

  const fieldOf = (el: HTMLElement) => el.querySelector<HTMLElement>("[data-edit-field]");
  const onBlockDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const field = fieldOf(e.currentTarget);
    // Escribiendo: el puntero es del texto (caret, selección), no del arrastre.
    if (field && document.activeElement === field) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { x: e.clientX, y: e.clientY, moved: false, wasSelected: textSelected };
  };
  const onBlockMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.moved) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
      p.moved = true;
      setTextSelected(true);
      setDragging(true);
    }
    const box = areaRef.current?.getBoundingClientRect();
    if (box) setHoverCell(cellFromPointer(e.clientX, e.clientY, box));
  };
  const onBlockUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (p.moved) {
      const box = areaRef.current?.getBoundingClientRect();
      if (box) {
        const cell = cellFromPointer(e.clientX, e.clientY, box);
        // Un solo cambio con la posición completa (no uno por eje).
        onFieldChange?.("quote.text", { ...content.text, justify: JUSTIFY[cell.col], align: ALIGN[cell.row] });
      }
      setDragging(false);
      setHoverCell(null);
      return;
    }
    if (!p.wasSelected) { setTextSelected(true); return; }
    const field = fieldOf(e.currentTarget);
    if (!field) return;
    field.focus();
    const range = document.createRange();
    range.selectNodeContents(field);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Con imagen, la cita se ve igual que en celular también en el layout
  // dividido (tarjeta con su ancho, no a todo el ancho); sin imagen, la frase
  // de la sección web.
  if (isSplit && !content.image.active) {
    if (!content.active || !(hasQuoteContent || hasSeparator)) return null;
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={moduleBg}
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasQuoteContent && (
          <p
            className={styles.web_plain}
            style={{ color: content.inverted ? primary : accent, fontFamily: content.text.font.typeFace }}
          >
            {renderTextWithStrong(content.text.font.value ?? "")}
          </p>
        )}
      </WebSection>
    );
  }

  const mobile = (
    <>
      {content.active && (hasQuoteContent || hasSeparator || editMode) ? (
        <>
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            // Imagen o color de fondo, no los dos: con imagen el color no se pinta.
            backgroundColor: content?.dynamic_background?.active && !content.image.active ? moduleBg : "transparent",
            // Textura propia del bloque, detrás del contenido (ModuleBackdrop).
            isolation: "isolate",
            // Relleno arriba / abajo propio del bloque (dynamic_background.padding_y).
            ...moduleBoxExtras(content?.dynamic_background),
            borderRadius: content?.dynamic_background?.border_radius,
            // Con imagen, su propio largo (image.width); si no tiene, el del
            // fondo de color como antes.
            width: content.image.active
              ? `${(content.image as { width?: number | null }).width ?? (content?.dynamic_background?.active ? content.dynamic_background.width : 100)}%`
              : content?.dynamic_background?.active ? `${content.dynamic_background.width}%` : '100%',
            // Con imagen la sombra va en la imagen (abajo), no en todo el
            // módulo: si no, también envolvía el separador.
            boxShadow: content?.dynamic_background?.active && !content.image.active ? content.dynamic_background.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasQuoteContent ? (content?.image?.active ? 0 : `${content?.dynamic_background?.padding_y ?? 24}px 24px`) : 0,

          }}>
          {/* La Cita ya tiene su imagen de fondo: aquí solo la textura propia. */}
          <ModuleBackdrop bg={{ ...content?.dynamic_background, image: null }} />

          {hasQuoteContent && (content.image.active ? (
            <FadeIn>
              <div className="background_image_quote_container" style={{
                borderRadius: content?.dynamic_background?.border_radius,
                boxShadow: content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : undefined,
              }}>
                <div style={{ backgroundColor: 'transparent', height: "100%", width: "100%" }}>
                  {image_src && <Image fill style={{ objectFit: "cover" }} loading="lazy" decoding="async" alt="" src={image_src} />}
                </div>

                {/* Efectos sobre la imagen. Con los de la portada guardados
                    (image.background / image.blur + sus ajustes) se dibujan
                    igual que allá; si no, la sombra vieja (text.shadow). */}
                {imageFx.custom ? (
                  imageFx.shadow ? (
                    <div
                      style={{
                        position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply",
                        background: shadowBackground(imageFx.shadowSettings, primary),
                      }}
                    />
                  ) : imageFx.blur ? (
                    <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", ...blurStyle(imageFx.blurSettings) }} />
                  ) : null
                ) : content.text.shadow && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "400px",
                      top: "0px",
                      left: "50%",
                      transform: "translate(-50%)",
                      background: `linear-gradient(to top, ${darker(accent, 0.7)}80, rgba(0,0,0,0))`,
                      mixBlendMode: 'multiply'
                    }}
                  ></div>
                )}

                <div
                  ref={areaRef}
                  className={!dev ? "qt_image_cnt" : undefined}
                  style={{
                    height: "400px",
                    display: "flex",
                    alignItems: content.text.align,
                    position: "absolute",
                    width: "100%",
                    top: "0px",
                    left: "50%",
                    transform: "translate(-50%)",
                    padding: "24px",
                    // El bloque va en la columna de su cuadrante (antes siempre
                    // al centro: con ancho < 100 % solo cambiaba el texto).
                    justifyContent: JUSTIFY_FLEX[content.text.justify ?? "center"] ?? "center",
                    lineHeight: '1.4',
                    boxSizing: "border-box",
                  }}
                >
                  {/* "Cambiar fondo" sobre la imagen, como el de la portada: se ve
                      con la cita elegida y abre el fondo en el editor. Si el
                      texto está en la fila del centro, sube para no taparlo. */}
                  {/* En el editor de escritorio (textBar) el fondo se cambia desde
                      la barra que sale al elegir la Cita: sin este botón. */}
                  {editMode && !textBar && !textSelected && (
                    <button
                      type="button"
                      className="edit_center_btn"
                      data-edit-hit
                      style={currentCell.row === 1 ? { top: 24, transform: "translateX(-50%)" } : undefined}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const r = e.currentTarget.getBoundingClientRect();
                        onFieldTool?.("quote_image", { x: r.left, y: r.top, w: r.width, h: r.height }, "quote");
                      }}
                    >
                      <ImagePlus size={14} />
                      Cambiar fondo
                    </button>
                  )}
                  {editMode && textSelected && (
                    <div className="edit_grid" data-dragging={dragging || undefined}>
                      {Array.from({ length: 9 }, (_, i) => {
                        const cell = { col: i % 3, row: Math.floor(i / 3) };
                        return (
                          <div
                            key={i}
                            className="edit_cell"
                            data-current={(cell.col === currentCell.col && cell.row === currentCell.row) || undefined}
                            data-hover={(hoverCell?.col === cell.col && hoverCell?.row === cell.row) || undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                  {editMode ? (
                    <div
                      className="edit_block"
                      data-quote-block
                      data-edit-hit
                      data-selected={textSelected || undefined}
                      data-dragging={dragging || undefined}
                      style={{ width: `${content.text.width ?? 100}%` }}
                      onPointerDown={onBlockDown}
                      onPointerMove={onBlockMove}
                      onPointerUp={onBlockUp}
                      onPointerCancel={onBlockUp}
                      onDragStart={(e) => e.preventDefault()}
                      // Como el título de la portada: el clic no sube a la zona,
                      // que lo tomaría como "Cita sin campo" y soltaría el texto.
                      onClick={(e) => e.stopPropagation()}
                    >
                      {textSelected && !textBar && (
                        <button
                          type="button"
                          className="edit_field_tool"
                          data-edit-hit
                          aria-label="Tipografía de la cita"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            const r = e.currentTarget.getBoundingClientRect();
                            onFieldTool?.("quote_text", { x: r.left, y: r.top, w: r.width, h: r.height }, "quote");
                          }}
                        >
                          <Type size={15} strokeWidth={2.4} />
                        </button>
                      )}
                      <EditableText
                        path="quote.text.font.value"
                        value={content.text.font.value ?? ""}
                        editMode={editMode}
                        onFieldChange={onFieldChange}
                        multiline
                        render={renderTextWithStrong}
                        className="g_mdoule_regular_text"
                        style={{
                          display: "block",
                          whiteSpace: "pre-line",
                          color: content.text.font.color,
                          fontFamily: content.text.font.typeFace ?? "Poppins",
                          fontSize: `${content.text.font.size}px`,
                          opacity: content.text.font.opacity,
                          fontWeight: content.text.font.weight,
                          textAlign: content.text.justify,
                          width: "100%",
                          ...fontExtras(content.text.font),
                        }}
                      />
                    </div>
                  ) : (
                  <EditableText
                    path="quote.text.font.value"
                    value={content.text.font.value ?? ""}
                    editMode={editMode}
                    onFieldChange={onFieldChange}
                    multiline
                    render={renderTextWithStrong}
                    className="g_mdoule_regular_text"
                    style={{
                      whiteSpace: "pre-line",
                      color: content.text.font.color,
                      fontFamily: content.text.font.typeFace ?? "Poppins",
                      fontSize: `${content.text.font.size}px`,
                      opacity: content.text.font.opacity,
                      fontWeight: content.text.font.weight,
                      textAlign: content.text.justify,
                      width: `${content.text.width}%`,
                    }}
                  />
                  )}
                </div>
              </div>
            </FadeIn>
          ) : (
            <EditableText
              path="quote.text.font.value"
              value={content.text.font.value ?? ""}
              editMode={editMode}
              onFieldChange={onFieldChange}
              multiline
              render={renderTextWithStrong}
              className="g_mdoule_regular_text"
              style={{
                color: content.inverted ? primary : accent,
                fontFamily: content.text.font.typeFace,
                fontSize: `16px`,
                textAlign: "center",
                width: "60%",
                fontStyle: "italic",
                padding: "64px 0px",
                whiteSpace: "pre-line",
                lineHeight: '1.4'
              }}
            />
          ))}

        </div>
        </>
      ) : (
        <></>
      )}
    </>
  );

  // En el layout dividido el contenido se recorre lo que tapa la portada
  // (--aside-overlap, ver invitation.module.css) para quedar centrado.
  return isSplit ? (
    <div style={{ width: "100%", paddingLeft: "var(--aside-overlap, 0px)", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>{mobile}</div>
  ) : mobile;
});
