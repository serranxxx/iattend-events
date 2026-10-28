"use client";

import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import Image from "next/image";
import React, { forwardRef, useState } from "react";
import styles from "./dresscode.module.css";
import { Button, ColorPicker, Input, Popover } from "antd";
import { Plus, X } from "lucide-react";
import { useEditableList } from "../useEditableList";
import { Pin as FaPinterest } from 'lucide-react';
import FadeLeft from "@/components/Motion/FadeLeft";
import FadeIn from "@/components/Motion/FadeIn";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";
import { EditableText } from "../EditableText";

// Agregar un color a la paleta (modo edición). El color se agrega al cerrar
// el selector, no a cada arrastre dentro de él (si no, saldría uno por paso).
function AddColor({ children, onAdd }: { children: React.ReactNode; onAdd: (_hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <ColorPicker
      open={open}
      disabledAlpha
      value={picked ?? "#C9B79C"}
      onChange={(c) => setPicked(c.toHexString())}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && picked) { onAdd(picked); setPicked(null); }
      }}
    >
      {children}
    </ColorPicker>
  );
}

// Link de inspiración (Pinterest) en modo edición: el botón abre un popover
// para cambiar el link o eliminarlo.
function LinkEditor({ link, open, onOpenChange, onChange, onRemove, children }: {
  link: string;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onChange: (_value: string) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="click"
      placement="top"
      arrow={false}
      styles={{ body: { borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" } }}
      content={
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1B1B", fontFamily: "system-ui, -apple-system, sans-serif" }}>Link de inspiración</span>
          <Input
            autoFocus
            placeholder="https://pinterest.com/…"
            value={link}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderRadius: 99 }}
          />
          <button type="button" className="edit_row_delete" style={{ alignSelf: "center", marginTop: 0 }} onClick={onRemove}>
            Eliminar
          </button>
        </div>
      }
    >
      {children}
    </Popover>
  );
}

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  // Modo edición (ver Invitation.tsx): título y descripción encima, fondo,
  // ocultar y separador.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export const DressCode = forwardRef<HTMLDivElement, DresscodeProps>(function Greeting({ ui, dev, invitation, editMode = false, onFieldChange, onFieldTool }, ref) {
  const content = invitation.dresscode;
  const generals = invitation.generals;

  const images_src = dev ? content.dev : content.prod;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  // Fondo del módulo: su color propio si lo tiene, si no el secundario del
  // tema. Solo para el fondo; botones y bordes siguen con el del tema.
  const moduleBg = content?.dynamic_background?.custom_color || secondary;
  const accent = generals?.colors.accent ?? "#FFFFFF";

  const title = {
    font: invitation?.generals.fonts.titles?.typeFace ?? invitation?.generals.fonts.body?.typeFace,
    weight: invitation?.generals.fonts.titles?.weight === 0 ? 600 : (invitation?.generals.fonts.titles?.weight ?? 600),
    size: invitation?.generals.fonts.titles?.size === 0 ? 22 : (invitation?.generals.fonts.titles?.size ?? 22),
    opacity: invitation?.generals.fonts.titles?.opacity ?? 1,
    color: invitation?.generals.fonts.titles?.color === '#000000' ? accent : (invitation?.generals.fonts.titles?.color ?? accent)
  }

  const body = {
    font: invitation?.generals.fonts.body?.typeFace,
    weight: invitation?.generals.fonts.body?.weight ?? 500,
    size: invitation?.generals.fonts.body?.size ?? 16,
    opacity: invitation?.generals.fonts.body?.opacity ?? 1,
    color: invitation?.generals.fonts.body?.color ?? accent
  }

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };


  const hasContent = Boolean(content?.title?.trim())
    || Boolean(content?.description?.trim())
    || Boolean(content?.colors?.length)
    || (content?.images_active && Boolean(images_src?.length))
    || (content?.links_active && Boolean(content?.links?.length));
  const hasSeparator = Boolean(content?.dynamic_separator?.active);

  // Link de inspiración abierto para editar (modo edición).
  const [openLink, setOpenLink] = useState<number | null>(null);

  const openImagesTool = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    // Desde el botón del recuadro vacío, el panel se centra en el recuadro.
    const box = (e.currentTarget.closest(".edit_drawer_empty_box") as HTMLElement | null) ?? e.currentTarget;
    const r = box.getBoundingClientRect();
    onFieldTool?.("dress_images", { x: r.left, y: r.top, w: r.width, h: r.height }, "dresscode");
  };

  // Paleta en modo edición: tocar un color lo elige (con su "×" para
  // borrarlo) y arrastrarlo a los lados cambia el orden (useEditableList, en x).
  const palette: string[] = content?.colors ?? [];
  const colorList = useEditableList<string>({
    items: palette,
    path: "dresscode.colors",
    editMode,
    onFieldChange,
    makeNew: () => "#C9B79C",
    axis: "x",
  });
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content.active || !generals || !(hasContent || hasSeparator)) return null;
    const textColor = content.inverted ? primary : accent;
    const images = content.images_active ? (images_src ?? []).filter(Boolean) : [];
    const links = content.links_active ? (content.links ?? []) : [];
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={moduleBg}
        maxWidth={960}
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasContent && (
          <div className={styles.web_grid}>
            <FadeLeft>
              <div className={`${styles.web_text} ${images.length === 0 ? styles.web_text_alone : ""}`}>
                {content.title && (
                  <span
                    className={web.title}
                    style={{ color: content.inverted ? primary : title.color, fontFamily: title.font ?? "Poppins", fontWeight: title.weight, opacity: title.opacity }}
                  >
                    {renderTextWithStrong(content.title)}
                  </span>
                )}
                {content.description && (
                  <p className={web.body} style={{ color: textColor, fontFamily: body.font ?? "Poppins", fontWeight: body.weight, opacity: body.opacity }}>
                    {renderTextWithStrong(content.description)}
                  </p>
                )}
                {content.colors?.length > 0 && (
                  <div className={styles.web_palette}>
                    {content.colors.map((color, index) => (
                      <div
                        key={index}
                        className={styles.web_swatch}
                        style={{ borderColor: content?.background ? secondary : primary, backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                {links.length > 0 && (
                  <div className={styles.web_links}>
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${web.pill_btn} ${styles.web_link}`}
                        style={{
                          backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                          color: accent,
                          fontWeight: 400,
                        }}
                      >
                        <FaPinterest />
                        {ui?.buttons.inspiration}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </FadeLeft>

            {images.length > 0 && (
              <FadeIn>
                <div className={styles.web_images} style={{ width: "100%" }}>
                  {images.map((image, index) => (
                    <div key={index} className={styles.web_image}>
                      <Image fill sizes="25vw" alt="" loading="lazy" src={image} style={{ objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </FadeIn>
            )}
          </div>
        )}
      </WebSection>
    );
  }

  return content.active && generals && (hasContent || hasSeparator || editMode) ? (
    <>
      <div ref={ref} className="main_container"
        style={{
          position: "relative",
          backgroundColor: content?.dynamic_background?.active ? moduleBg : "transparent",
            // Imagen y textura propias del bloque van detrás (ModuleBackdrop).
            isolation: "isolate",
            // Relleno arriba / abajo propio del bloque (dynamic_background.padding_y).
            ...moduleBoxExtras(content?.dynamic_background),
          borderRadius: content?.dynamic_background?.border_radius,
          width: hasModuleBg(content?.dynamic_background) ? `${content.dynamic_background.width}%` : '100%',
          boxShadow: hasModuleBg(content?.dynamic_background) ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
          padding: hasContent ? undefined : 0,
        }}>
          <ModuleBackdrop bg={content?.dynamic_background} />

        {(hasContent || editMode) && (
        <div className="g_module_info_container">
          <FadeLeft>
            <EditableText
              path="dresscode.title"
              value={content.title ?? ""}
              editMode={editMode}
              onFieldChange={onFieldChange}
              multiline
              render={renderTextWithStrong}
              placeholder="Título"
              className="g_module_title"
              style={{
                display: "inline-block", whiteSpace: "pre-line",
                color: content?.inverted ? primary : title.color,
                fontFamily: title.font ?? "Poppins",
                fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
              }}
            />
          </FadeLeft>

          <FadeLeft>
            <EditableText
              path="dresscode.description"
              value={content?.description ?? ""}
              editMode={editMode}
              onFieldChange={onFieldChange}
              multiline
              render={renderTextWithStrong}
              placeholder="Descripción"
              className="g_mdoule_regular_text"
              style={{
                display: "inline-block", whiteSpace: "pre-line",
                color: content?.inverted ? primary : accent,
                fontFamily: body.font ?? "Poppins",
                fontWeight: body.weight, opacity: body.opacity
              }}
            />
          </FadeLeft>

          {content?.colors && content.colors.length > 0 && (
            <FadeIn>
              <div className={styles.color_palette_cont}>

                <div ref={colorList.listRef} className={styles.dresscode_colors} style={editMode ? { gap: 10 } : undefined}>
                  {content.colors.map((color, index) => editMode ? (
                    <div key={index} {...colorList.rowProps(index, { display: "flex" }, { outlineChild: true })} data-swatch>
                      <div
                        data-edit-card
                        className={styles.dresscode_color}
                        style={{ borderColor: content?.background ? secondary : primary, backgroundColor: color, marginLeft: 0 }}
                      />
                      {colorList.showDelete(index) && (
                        <button
                          type="button"
                          className="edit_swatch_remove"
                          data-edit-row-delete
                          aria-label="Borrar color"
                          onClick={(e) => { e.stopPropagation(); colorList.remove(index); }}
                        >
                          <X size={11} strokeWidth={2.6} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      key={index}
                      className={styles.dresscode_color}
                      style={{ borderColor: content?.background ? secondary : primary, backgroundColor: color }}
                    />
                  ))}
                  {/* Con colores: un "+" a la derecha para agregar otro. */}
                  {editMode && (
                    <AddColor onAdd={(hex) => onFieldChange?.("dresscode.colors", [...(content.colors ?? []), hex])}>
                      <button type="button" className="edit_color_add" data-edit-hit aria-label="Agregar color" onClick={(e) => e.stopPropagation()}>
                        <Plus size={16} />
                      </button>
                    </AddColor>
                  )}
                </div>
              </div>
            </FadeIn>
          )}
          {/* Sin paleta: el botón para empezarla con un primer color. */}
          {editMode && !(content?.colors && content.colors.length > 0) && (
            <AddColor onAdd={(hex) => onFieldChange?.("dresscode.colors", [hex])}>
              {/* Botón secundario, igual que "¿Necesitas inspiración?". */}
              <Button
                data-edit-hit
                icon={<Plus size={14} />}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                  color: accent,
                  boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                  border: "none",
                }}
              >
                Agregar paleta de colores
              </Button>
            </AddColor>
          )}

          {/* Imágenes: en modo edición, tocarlas abre en el editor un mini
              popover encima con todas en fila (agregar, ordenar, borrar). Sin
              imágenes, un recuadro con "Agregar imágenes" abre lo mismo. */}
          {editMode && !(content.images_active && (images_src ?? []).length > 0) && (
            <div className="edit_drawer_empty_box" style={{ minHeight: 200 }}>
              <Button
                data-edit-hit
                icon={<Plus size={14} />}
                onClick={openImagesTool}
                style={{
                  backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                  color: accent,
                  boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                  border: "none",
                }}
              >
                Agregar imágenes
              </Button>
            </div>
          )}
          {content.images_active && (images_src ?? []).length > 0 && (
            <div
              className={styles.scroll_invitation}
              style={{ zIndex: 2, cursor: editMode ? "pointer" : undefined }}
              data-edit-hit={editMode || undefined}
              onClick={editMode ? openImagesTool : undefined}
            >
              {(images_src ?? []).map((image, index) => (
                <FadeIn key={index}>
                  <div
                    style={{ position: "relative", padding: "6px 24px" }}
                    key={index}
                    className={`${styles.dresscode_image_container}${editMode ? " edit_hover_card" : ""}`}
                  >
                    {
                      image &&
                      <Image fill alt="" loading="lazy" src={image} style={{ objectFit: "cover" }} />

                    }
                  </div>
                </FadeIn>
              ))}
            </div>
          )}

          {/* Links de inspiración. En modo edición el botón no navega: abre su
              link para cambiarlo o eliminarlo; sin links hay un "Agregar
              inspiración". */}
          {editMode && !(content?.links_active && (content.links ?? []).length > 0) && (
            <Button
              data-edit-hit
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onFieldChange?.("dresscode", { ...content, links_active: true, links: [""] });
                setOpenLink(0);
              }}
              style={{
                backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                color: accent,
                boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                border: "none",
              }}
            >
              Agregar inspiración
            </Button>
          )}
          {content?.links_active && (
            <div className={dev ? "dresscode-links-dev" : "dresscode-links"}>
              {content.links &&
                content.links.map((link, index) => editMode ? (
                  <LinkEditor
                    key={index}
                    link={link ?? ""}
                    open={openLink === index}
                    onOpenChange={(o) => setOpenLink(o ? index : null)}
                    onChange={(value) => onFieldChange?.(`dresscode.links.${index}`, value)}
                    onRemove={() => {
                      setOpenLink(null);
                      const next = (content.links ?? []).filter((_, i) => i !== index);
                      onFieldChange?.("dresscode", { ...content, links: next, links_active: next.length > 0 });
                    }}
                  >
                    {/* El clic lo toma el span (disparador del popover): si el
                        botón de adentro cortaba el evento, el popover no abría. */}
                    <span className="edit_pick" data-edit-hit data-selected={openLink === index || undefined} onClick={(e) => e.stopPropagation()}>
                    <Button
                      data-edit-hit
                      icon={<FaPinterest />}
                      style={{
                        backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                        color: accent,
                        boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {ui?.buttons.inspiration ?? "¿Necesitas inspiración?"}
                    </Button>
                    </span>
                  </LinkEditor>
                ) : (
                  <FadeIn key={index}>
                    <Button
                      key={index}
                      href={link}
                      target="_blank"
                      icon={<FaPinterest />}
                      style={{
                        backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                        color: accent,
                        // backgroundColor: "#E60024",
                        // color: "#FFF",
                        boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {ui?.buttons.inspiration ?? "HOLA"}
                    </Button>
                  </FadeIn>
                ))}
            </div>
          )}
        </div>
        )}
      </div>
    </>
  ) : null;
});
