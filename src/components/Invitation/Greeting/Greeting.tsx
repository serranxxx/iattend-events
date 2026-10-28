
"use client";

import { NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import React, { forwardRef } from "react";
import FadeLeft from "@/components/Motion/FadeLeft";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";
import { EditableText } from "../EditableText";
import { GREETING_STYLE_IDS, GreetingStyleId, StyledGreeting } from "./GreetingStyles";

type GreetingProps = {
  dev: boolean;
  invitation: NewInvitation | null;
  // Modo edición (ver Invitation.tsx): los textos se escriben directo encima.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  // Abre en el editor el panel de una parte del módulo (hoy: el separador).
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export const Greeting = forwardRef<HTMLDivElement, GreetingProps>(function Greeting({ dev: _dev, invitation, editMode = false, onFieldChange, onFieldTool: _onFieldTool }, ref) {
  const content = invitation?.greeting;
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

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const hasContent = Boolean(content?.title?.trim()) || Boolean(content?.description?.trim());
  // Estilo del catálogo (greeting.style); "W1" o vacío = la clásica de abajo.
  const styleId = (GREETING_STYLE_IDS as readonly string[]).includes(content?.style ?? "") ? (content?.style as GreetingStyleId) : "W1";
  const titleColor = content?.inverted ? primary : title?.color;
  const greetingTitle = (style: React.CSSProperties) => (
    <EditableText
      path="greeting.title"
      value={content?.title ?? ""}
      editMode={editMode}
      onFieldChange={onFieldChange}
      multiline
      render={renderTextWithStrong}
      className="g_module_title"
      style={{
        display: "block", whiteSpace: "pre-line", textAlign: "center",
        color: titleColor, fontFamily: title?.font ?? "Poppins",
        fontSize: title?.size, fontWeight: title?.weight, opacity: title?.opacity,
        ...style,
      }}
    />
  );
  const greetingText = (style: React.CSSProperties) => (
    <EditableText
      path="greeting.description"
      value={content?.description ?? ""}
      editMode={editMode}
      onFieldChange={onFieldChange}
      multiline
      render={renderTextWithStrong}
      className="g_module_regular_text"
      style={{
        display: "block", whiteSpace: "pre-line", textAlign: "center",
        color: content?.inverted ? primary : accent, fontFamily: body.font ?? "Poppins",
        fontWeight: body.weight, opacity: body.opacity,
        ...style,
      }}
    />
  );
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content?.active || !generals?.colors || !(hasContent || hasSeparator)) return null;
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
            <FadeLeft>
              <span
                className={`${web.title} ${web.title_lg}`}
                style={{
                  color: content.inverted ? primary : title.color,
                  fontFamily: title.font ?? "Poppins",
                  fontWeight: title.weight, opacity: title.opacity,
                }}
              >
                {renderTextWithStrong(content.title ?? "")}
              </span>
            </FadeLeft>
            <FadeLeft>
              <p
                className={`${web.body} ${web.body_lg}`}
                style={{
                  color: content.inverted ? primary : accent,
                  fontFamily: body.font ?? "Poppins",
                  fontWeight: body.weight, opacity: body.opacity,
                }}
              >
                {renderTextWithStrong(content.description ?? "")}
              </p>
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
            // Estilos del catálogo: encima de la textura de la invitación
            // (TextureOverlay, z 0), como los demás catálogos.
            ...(styleId === "W1" ? {} : { zIndex: 1 }),
            // Relleno arriba / abajo propio del bloque (dynamic_background.padding_y).
            ...moduleBoxExtras(content?.dynamic_background),
            borderRadius: content?.dynamic_background?.border_radius,
            width: hasModuleBg(content?.dynamic_background) ? `${content?.dynamic_background?.width}%` : '100%',
            boxShadow: hasModuleBg(content?.dynamic_background) ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasContent ? undefined : 0,
          }}>
          <ModuleBackdrop bg={content?.dynamic_background} />

          {hasContent && (
            <div
              className="g_module_info_container"
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              {styleId !== "W1" ? (
                <StyledGreeting
                  styleId={styleId}
                  titleText={content.title ?? ""}
                  bodyText={content.description ?? ""}
                  title={greetingTitle}
                  text={greetingText}
                  ink={content?.inverted ? primary : accent}
                  secondary={secondary}
                  bg={content?.dynamic_background?.active ? moduleBg : primary}
                  serif={title?.font ?? "Poppins"}
                  sans={body.font ?? "Poppins"}
                  titleSize={title?.size ?? 22}
                  titleColor={titleColor}
                  titleWeight={title?.weight ?? 600}
                  editMode={editMode}
                />
              ) : (<>
              <FadeLeft>
                <EditableText
                  path="greeting.title"
                  value={content.title ?? ""}
                  editMode={editMode}
                  onFieldChange={onFieldChange}
                  multiline
                  render={renderTextWithStrong}
                  className="g_module_title"
                  style={{
                    display: "inline-block", whiteSpace: "pre-line",
                    color: content?.inverted ? primary : title?.color,
                    fontFamily: title?.font ?? "Poppins",
                    fontSize: title?.size, fontWeight: title?.weight, opacity: title?.opacity
                  }}
                />
              </FadeLeft>

              <FadeLeft>
                <EditableText
                  path="greeting.description"
                  value={content.description ?? ""}
                  editMode={editMode}
                  onFieldChange={onFieldChange}
                  multiline
                  render={renderTextWithStrong}
                  className="g_module_regular_text"
                  style={{
                    display: "inline-block", whiteSpace: "pre-line",
                    color: content?.inverted ? primary : accent,
                    fontFamily: body.font ?? "Poppins",
                    fontWeight: body.weight, opacity: body.opacity
                  }}
                />
              </FadeLeft>
              </>)}

            </div>
          )}

        </div>
        </>
      ) : null}


    </>
  );
});
