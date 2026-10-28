import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import React, { forwardRef } from "react";
import { GALLERY_STYLE_IDS, GalleryStyleId, StyledGallery } from "./GalleryStyles";
import FadeLeft from "@/components/Motion/FadeLeft";
import FadeIn from "@/components/Motion/FadeIn";
import GalleryWeb from "./GalleryWeb/GalleryWeb";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";
import { Button } from "antd";
import { Plus } from "lucide-react";
import { EditableText } from "../EditableText";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  // Modo edición (ver Invitation.tsx): título encima, fondo, ocultar,
  // separador e imágenes (mismo mini panel que el dresscode).
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export const Gallery = forwardRef<HTMLDivElement, DresscodeProps>(function Gallery({ dev, invitation, ui, editMode = false, onFieldChange, onFieldTool }, ref) {
  const content = invitation.gallery;
  const generals = invitation.generals;

  const images = dev ? content.dev : content.prod;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  // Fondo del módulo: su color propio si lo tiene, si no el secundario del
  // tema. Solo para el fondo; botones y bordes siguen con el del tema.
  const moduleBg = content?.dynamic_background?.custom_color || secondary;

  // Imágenes en modo edición: tocarlas abre en el editor el mini panel que
  // se pone encima de ellas (agregar, ordenar, borrar), como el dresscode.
  const openImagesTool = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const box = (e.currentTarget.closest(".edit_drawer_empty_box") as HTMLElement | null) ?? e.currentTarget;
    const r = box.getBoundingClientRect();
    onFieldTool?.("gallery_images", { x: r.left, y: r.top, w: r.width, h: r.height }, "gallery");
  };
  const accent = generals?.colors.accent ?? "#FFFFFF";

  const title = {
    font: invitation?.generals.fonts.titles?.typeFace ?? invitation?.generals.fonts.body?.typeFace,
    weight: invitation?.generals.fonts.titles?.weight === 0 ? 600 : (invitation?.generals.fonts.titles?.weight ?? 600),
    size: invitation?.generals.fonts.titles?.size === 0 ? 22 : (invitation?.generals.fonts.titles?.size ?? 22),
    opacity: invitation?.generals.fonts.titles?.opacity ?? 1,
    color: invitation?.generals.fonts.titles?.color === '#000000' ? accent : (invitation?.generals.fonts.titles?.color ?? accent)
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

  // Estilo del catálogo (gallery.style); "G1" o vacío = la base (pila → carrusel).
  const styleId = (GALLERY_STYLE_IDS as readonly string[]).includes(content?.style ?? "") ? (content.style as GalleryStyleId) : "G1";

  const hasContent = Boolean(content?.title?.trim()) || Boolean(images?.length);
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content.active || !generals || !(hasContent || hasSeparator)) return null;
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={secondary}
        bleed
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasContent && (
          <FadeIn>
            <GalleryWeb
              images={images ?? []}
              ui={ui}
              textColor={content.inverted ? primary : accent}
              placeholder={`${secondary}30`}
              title={
                <span
                  className={web.title}
                  style={{ color: content.inverted ? primary : title.color, fontFamily: title.font ?? "Poppins", fontWeight: title.weight, opacity: title.opacity }}
                >
                  {renderTextWithStrong(content.title ?? "")}
                </span>
              }
            />
          </FadeIn>
        )}
      </WebSection>
    );
  }

  return (
    <>
      {content.active && generals && (hasContent || hasSeparator || editMode) && (
        <>
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            backgroundColor: content?.dynamic_background?.active ? moduleBg : "transparent",
            // Imagen y textura propias del bloque van detrás (ModuleBackdrop).
            isolation: "isolate",
            // Encima de la textura de la invitación (TextureOverlay, z 0),
            // como regalos y actividades.
            zIndex: 1,
            // Relleno arriba / abajo propio del bloque (dynamic_background.padding_y).
            ...moduleBoxExtras(content?.dynamic_background),
            borderRadius: content?.dynamic_background?.border_radius,
            width: hasModuleBg(content?.dynamic_background) ? `${content.dynamic_background.width}%` : '100%',
            boxShadow: hasModuleBg(content?.dynamic_background) ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasContent ? undefined : 0,
          }}>
          <ModuleBackdrop bg={content?.dynamic_background} />
          {(hasContent || editMode) && (
          <div className="g_module_info_container" style={{
            // width:'auto'
          }}>
            <FadeLeft>
              <EditableText
                path="gallery.title"
                value={content.title ?? ""}
                editMode={editMode}
                onFieldChange={onFieldChange}
                multiline
                render={renderTextWithStrong}
                placeholder="Título"
                className="g_module_title"
                style={{
                  display: "inline-block", whiteSpace: "pre-line",
                  color: content.inverted ? primary : title.color,
                  fontFamily: title.font ?? "Poppins",
                  fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
                }}
              />
            </FadeLeft>
            {
              images?.length > 0 &&
              <FadeIn>
                <div
                  className={editMode ? "edit_hover_card" : undefined}
                  data-edit-hit={editMode || undefined}
                  // Los estilos del catálogo ocupan el ancho del bloque.
                  style={{ ...(editMode ? { borderRadius: 16, cursor: "pointer" } : {}), width: "100%" }}
                  // En edición el toque es para el panel, no para el abanico.
                  onClickCapture={editMode ? openImagesTool : undefined}
                >
                  <StyledGallery styleId={styleId} images={images} invitation={invitation} editMode={editMode} />
                </div>
              </FadeIn>
            }
            {editMode && !(images?.length > 0) && (
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
          </div>
          )}
        </div>
        </>
      )}
    </>
  );
});
