import { NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import React, { forwardRef } from "react";
import { Plus } from "lucide-react";
import FadeLeft from "@/components/Motion/FadeLeft";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";
import { EditableText } from "../EditableText";
import { useEditableList } from "../useEditableList";

type NoticesProps = {
  dev: boolean;
  invitation: NewInvitation;
  // Modo edición (ver Invitation.tsx): los textos se escriben directo encima.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export const Notices = forwardRef<HTMLDivElement, NoticesProps>(function Notices({ dev: _dev, invitation, editMode = false, onFieldChange, onFieldTool: _onFieldTool }, ref) {
  const content = invitation.notices;
  const generals = invitation.generals;


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


  // Avisos en modo edición: igual que las personas (ver useEditableList).
  const notices: string[] = content?.notices ?? [];
  const list = useEditableList<string>({
    items: notices,
    path: "notices.notices",
    editMode,
    onFieldChange,
    makeNew: () => "Nuevo aviso",
  });

  const hasContent = Boolean(content?.title?.trim()) || Boolean(content?.notices?.length);
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content.active || !generals || !(hasContent || hasSeparator)) return null;
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={moduleBg}
        maxWidth={640}
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasContent && (
          <div className={web.stack}>
            {content.title && (
              <FadeLeft>
                <span
                  className={web.title}
                  style={{ color: content.inverted ? primary : title.color, fontFamily: title.font ?? "Poppins", fontWeight: title.weight, opacity: title.opacity }}
                >
                  {content.title}
                </span>
              </FadeLeft>
            )}
            <FadeLeft>
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                {(content.notices ?? []).map((item, index) => (
                  <p
                    key={index}
                    className={web.body}
                    style={{ color: content.inverted ? primary : accent, fontFamily: body.font ?? "Poppins", fontWeight: body.weight, opacity: body.opacity }}
                  >
                    {renderTextWithStrong(item ?? "")}
                  </p>
                ))}
              </div>
            </FadeLeft>
          </div>
        )}
      </WebSection>
    );
  }

  return (
    <>
      {content.active && generals && (hasContent || hasSeparator || editMode) ? (
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
            boxShadow: hasModuleBg(content?.dynamic_background) ? content.dynamic_background.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasContent ? undefined : 0,
          }}>
          <ModuleBackdrop bg={content?.dynamic_background} />
          {(hasContent || editMode) && (
          <div className="g_module_info_container">
            <FadeLeft>
              <EditableText
                path="notices.title"
                value={content.title ?? ""}
                editMode={editMode}
                onFieldChange={onFieldChange}
                className="g_module_title"
                style={{
                  display: "inline-block", whiteSpace: "pre-line",
                  color: content.inverted ? primary : title.color,
                  fontFamily: title.font ?? "Poppins",
                  fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
                }}
              />
            </FadeLeft>

            <div ref={list.listRef} style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", alignItems: "center", gap: "inherit" }}>
            {notices.map((item, index) => (
                <div key={index} {...list.rowProps(index, { display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch", gap: "12px" })}>
                  <FadeLeft>
                    <EditableText
                      path={`notices.notices.${index}`}
                      value={item ?? ""}
                      editMode={editMode}
                      onFieldChange={onFieldChange}
                      multiline
                      render={renderTextWithStrong}
                      className="g_mdoule_regular_text"
                      style={{
                        display: "inline-block", whiteSpace: "pre-line",
                        color: content.inverted ? primary : accent,
                        fontFamily: body.font ?? "Poppins",
                        fontWeight: body.weight, opacity: body.opacity
                      }}
                    />
                  </FadeLeft>

                  {list.showDelete(index) && (
                    <button
                      type="button"
                      className="edit_row_delete"
                      data-edit-row-delete
                      onClick={(e) => { e.stopPropagation(); list.remove(index); }}
                    >
                      Eliminar
                    </button>
                  )}

                  {index < notices.length - 1 && (
                    <FadeLeft>
                      <span
                        className="g_mdoule_regular_text"
                        style={{
                          display: "inline-block", whiteSpace: "pre-line",
                          color: content.inverted ? primary : accent,
                          fontFamily: body.font ?? "Poppins",
                          fontWeight: body.weight, opacity: body.opacity
                        }}
                      >
                        ...
                      </span>
                    </FadeLeft>
                  )}
                </div>
              ))}
            {list.dropAtEnd && <div className="edit_row_drop_end" />}
            </div>

            {editMode && (
              <button type="button" className="edit_glass_btn" data-edit-hit onClick={(e) => { e.stopPropagation(); list.add(); }}>
                <Plus size={15} />
                Agregar aviso
              </button>
            )}
          </div>
          )}

        </div>
        </>
      ) : null}
    </>
  );
});
