import { NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import React, { forwardRef } from "react";
import { Plus } from "lucide-react";
import FadeLeft from "@/components/Motion/FadeLeft";
import { lighter } from "@/helpers/functions";
import { EditableText } from "../EditableText";
import { useEditableList } from "../useEditableList";
import styles from "./family.module.css";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";

type peopleProps = {
  dev: boolean;
  invitation: NewInvitation;
  invitationID?: string;
  // Modo edición (ver Invitation.tsx): textos encima, personas que se borran,
  // agregan y reordenan arrastrando, y separador tocable.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

type Persona = NewInvitation["people"]["personas"][number];

export const People = forwardRef<HTMLDivElement, peopleProps>(function Greeting({ dev: _dev, invitation, invitationID, editMode = false, onFieldChange, onFieldTool: _onFieldTool }, ref) {
  const content = invitation?.people;
  const generals = invitation?.generals;

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


  // Personas en modo edición: elegir, arrastrar, borrar y agregar (ver
  // useEditableList).
  const personas: Persona[] = content?.personas ?? [];
  const list = useEditableList<Persona>({
    items: personas,
    path: "people.personas",
    editMode,
    onFieldChange,
    makeNew: () => ({ title: "Rol", description: "Nombre" }),
  });

  const hasContent = Boolean(content?.title?.trim()) || Boolean(content?.personas?.length);
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content?.active || !generals?.colors || !(hasContent || hasSeparator)) return null;

    const personas = content.personas ?? [];
    // El "&" que el organizador escribe como persona divide los dos lados.
    const ampIndex = personas.findIndex((p) => p.description?.trim() === "&");
    const reversed = invitationID === "80d0c716-86e4-4c90-9e6d-9133d970d769";
    const textColor = content.inverted ? primary : accent;
    const labelColor = content.inverted ? primary : lighter(accent, 0.4) ?? "#000";

    const renderPerson = (persona: (typeof personas)[number], index: number) => (
      <div key={index} className={styles.web_person} style={{ flexDirection: reversed ? "column-reverse" : undefined }}>
        {persona.title && (
          <span className={styles.web_person_label} style={{ color: labelColor, fontFamily: body.font ?? "Poppins", opacity: body.opacity }}>
            {persona.title}
          </span>
        )}
        <span className={styles.web_person_name} style={{ color: textColor, fontFamily: body.font ?? "Poppins", opacity: body.opacity }}>
          {persona.description}
        </span>
      </div>
    );

    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={moduleBg}
        maxWidth={860}
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasContent && (
          <div className={web.stack} style={{ gap: 48 }}>
            {content.title && (
              <span
                className={web.title}
                style={{ color: content.inverted ? primary : title.color, fontFamily: title.font ?? "Poppins", fontWeight: title.weight, opacity: title.opacity }}
              >
                {content.title}
              </span>
            )}
            <FadeLeft>
              {ampIndex >= 0 ? (
                <div className={styles.web_grid}>
                  <div className={styles.web_side}>{personas.slice(0, ampIndex).map(renderPerson)}</div>
                  <span className={styles.web_amp} style={{ color: textColor, fontFamily: title.font ?? "Poppins" }}>&amp;</span>
                  <div className={styles.web_side}>{personas.slice(ampIndex + 1).map(renderPerson)}</div>
                </div>
              ) : (
                <div className={`${styles.web_grid} ${styles.web_grid_plain}`}>{personas.map(renderPerson)}</div>
              )}
            </FadeLeft>
          </div>
        )}
      </WebSection>
    );
  }

  return (
    <>
      {content?.active && generals?.colors && (hasContent || hasSeparator || editMode) ? (
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
            width: hasModuleBg(content?.dynamic_background) ? `${content?.dynamic_background?.width}%` : '100%',
            boxShadow: hasModuleBg(content?.dynamic_background) ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasContent ? undefined : 0,
            // gap:'44px'
          }}>
          <ModuleBackdrop bg={content?.dynamic_background} />

          {(hasContent || editMode) && (
          <div className="g_module_info_container">
            <EditableText
              path="people.title"
              value={content.title ?? ""}
              editMode={editMode}
              onFieldChange={onFieldChange}
              multiline
              className="g_module_title"
              style={{
                display: "inline-block", whiteSpace: "pre-line",
                color: content?.inverted ? primary : title.color,
                fontFamily: title.font ?? "Poppins",
                fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
              }}
            />

            <div ref={list.listRef} style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", gap: "inherit" }}>
            {personas.map((persona, index) => {
              return (
                <div
                  key={index}
                  {...list.rowProps(index, {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexDirection: "column",
                    gap: "0px",
                    alignSelf: "stretch",
                  })}
                >
                  <FadeLeft>
                    <div
                      className="g_module_items_single_col"
                      style={{ flexDirection: invitationID === "80d0c716-86e4-4c90-9e6d-9133d970d769" ? "column-reverse" : undefined, }}
                    >
                      <EditableText
                        path={`people.personas.${index}.title`}
                        value={persona.title ?? ""}
                        editMode={editMode}
                        onFieldChange={onFieldChange}
                        className="g_mdoule_light_text"
                        style={{
                          display: "inline-block", whiteSpace: "pre-line",
                          color: content.inverted ? primary : lighter(accent, 0.4) ?? "#000",
                          fontFamily: body.font ?? "Poppins",
                          fontWeight: body.weight, opacity: body.opacity
                        }}
                      />

                      <EditableText
                        path={`people.personas.${index}.description`}
                        value={persona.description ?? ""}
                        editMode={editMode}
                        onFieldChange={onFieldChange}
                        className="g_mdoule_regular_text"
                        style={{
                          display: "inline-block", whiteSpace: "pre-line",
                          color: content.inverted ? primary : accent,
                          fontFamily: body.font ?? "Poppins",
                          fontWeight: body.weight, opacity: body.opacity
                        }}
                      />
                    </div>
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
                </div>
              );
            })}
            {list.dropAtEnd && <div className="edit_row_drop_end" />}
            </div>

            {editMode && (
              <button type="button" className="edit_glass_btn" data-edit-hit onClick={(e) => { e.stopPropagation(); list.add(); }}>
                <Plus size={15} />
                Agregar persona
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
