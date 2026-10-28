import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { ModuleBackdrop, hasModuleBg, moduleBoxExtras } from "../ModuleBackdrop";
import React, { forwardRef } from "react";
import styles from "./gifts.module.css";
import Wallet from "./Wallet/Wallet";
import type { GiftBrand } from "@/lib/giftBrands/cache";
import FadeLeft from "@/components/Motion/FadeLeft";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";
import { EditableText } from "../EditableText";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui: InvitationUIBundle;
  brands?: GiftBrand[];
  // Modo edición (ver Invitation.tsx): título y descripción encima, fondo,
  // ocultar y separador.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export const Gifts = forwardRef<HTMLDivElement, DresscodeProps>(function Greeting({ ui, dev, invitation, brands = [], editMode = false, onFieldChange, onFieldTool: _onFieldTool }, ref) {
  const content = invitation.gifts;
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

  const hasContent = Boolean(content?.title?.trim()) || Boolean(content?.description?.trim()) || Boolean(content?.cards?.length);
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content.active || !generals || !(hasContent || hasSeparator)) return null;
    const invertedOnBand = content?.dynamic_background?.active && content?.inverted;
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={secondary}
        maxWidth={960}
        separator={content.dynamic_separator}
        inverted={content.inverted}
        generals={generals}
      >
        {hasContent && (
          <div className={web.stack}>
            <FadeLeft>
              <span
                className={web.title}
                style={{ color: invertedOnBand ? primary : title.color, fontFamily: title.font ?? "Poppins", fontWeight: title.weight, opacity: title.opacity }}
              >
                {renderTextWithStrong(content.title ?? "")}
              </span>
            </FadeLeft>
            {content.description && (
              <FadeLeft>
                <p
                  className={web.body}
                  style={{ maxWidth: 560, marginInline: "auto", color: invertedOnBand ? primary : accent, fontFamily: body.font ?? "Poppins", fontWeight: body.weight, opacity: body.opacity }}
                >
                  {renderTextWithStrong(content.description)}
                </p>
              </FadeLeft>
            )}
            {/* La cartera es la misma de móvil, sin cambios visuales */}
            {content.cards.length > 0 && (
              <div className={styles.cards_container} style={{ alignSelf: "center", marginTop: 0 }}>
                <Wallet ui={ui} invitation={invitation} dev={dev} brands={brands} />
              </div>
            )}
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
            minWidth: hasContent ? '85%' : undefined,
            padding: hasContent ? undefined : 0,
          }}>
          <ModuleBackdrop bg={content?.dynamic_background} />

          {(hasContent || editMode) && (
          <div className="g_module_info_container">
            <FadeLeft>
              <EditableText
                path="gifts.title"
                value={content.title ?? ""}
                editMode={editMode}
                onFieldChange={onFieldChange}
                multiline
                render={renderTextWithStrong}
                placeholder="Título"
                className="g_module_title"
                style={{
                  display: "inline-block", whiteSpace: "pre-line",
                  color: content?.dynamic_background?.active && content?.inverted ? primary : title.color,
                  fontFamily: title.font ?? "Poppins",
                  fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
                }}
              />
            </FadeLeft>
            <FadeLeft>
              <EditableText
                path="gifts.description"
                value={content.description ?? ""}
                editMode={editMode}
                onFieldChange={onFieldChange}
                multiline
                render={renderTextWithStrong}
                placeholder="Descripción"
                className="g_mdoule_regular_text"
                style={{
                  display: "inline-block", whiteSpace: "pre-line",
                  color: content?.dynamic_background?.active && content?.inverted ? primary : accent,
                  fontFamily: body.font ?? "Poppins",
                  fontWeight: body.weight, opacity: body.opacity
                }}
              />
            </FadeLeft>
            <div
              className={styles.cards_container}
            >
              {
                (invitation.gifts.cards.length > 0 || editMode) &&
                <Wallet ui={ui} invitation={invitation} dev={dev} brands={brands} editMode={editMode} onFieldChange={onFieldChange} />
              }

            </div>
          </div>
          )}
        </div>
        </>
      ) : null}

    </>
  );
});
