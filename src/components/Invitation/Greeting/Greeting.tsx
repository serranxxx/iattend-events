
"use client";

import { NewInvitation } from "@/types/new_invitation";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import FadeLeft from "@/components/Motion/FadeLeft";
import Image from "next/image";
import { useIsSplitLayout } from "../layout/InvitationLayout";
import { WebSection } from "../layout/WebSection";
import web from "../layout/web-section.module.css";

type GreetingProps = {
  dev: boolean;
  invitation: NewInvitation | null;
};

export const Greeting = forwardRef<HTMLDivElement, GreetingProps>(function Greeting({ dev: _dev, invitation }, ref) {
  const content = invitation?.greeting;
  const generals = invitation?.generals;
  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
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
  const hasSeparator = Boolean(content?.dynamic_separator?.active);
  const isSplit = useIsSplitLayout();

  if (isSplit) {
    if (!content?.active || !generals?.colors || !(hasContent || hasSeparator)) return null;
    return (
      <WebSection
        ref={ref}
        background={content.dynamic_background}
        secondary={secondary}
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
      {content?.active && generals?.colors && (hasContent || hasSeparator) ? (
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            backgroundColor: content?.dynamic_background?.active ? secondary : "transparent",
            borderRadius: content?.dynamic_background?.border_radius,
            width: content?.dynamic_background?.active ? `${content?.dynamic_background?.width}%` : '100%',
            boxShadow: content?.dynamic_background?.active ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: hasContent ? undefined : 0,
          }}>

          {hasContent && (
            <div
              className="g_module_info_container"
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <FadeLeft>
                <span
                  className="g_module_title"
                  style={{
                    display: "inline-block", whiteSpace: "pre-line",
                    color: content?.inverted ? primary : title?.color,
                    fontFamily: title?.font ?? "Poppins",
                    fontSize: title?.size, fontWeight: title?.weight, opacity: title?.opacity
                  }}
                >
                  {renderTextWithStrong(content.title ?? "")}
                </span>
              </FadeLeft>

              <FadeLeft>
                <span
                  className="g_module_regular_text"
                  style={{
                    display: "inline-block", whiteSpace: "pre-line",
                    color: content?.inverted ? primary : accent,
                    fontFamily: body.font ?? "Poppins",
                    fontWeight: body.weight, opacity: body.opacity
                  }}
                >
                  {renderTextWithStrong(content.description ?? "")}
                </span>
              </FadeLeft>

            </div>
          )}

          {hasSeparator && (
            content?.dynamic_separator?.type === 'single' ?
              <Separador inverted={content.inverted} generals={generals} value={content?.dynamic_separator.single.value ?? 1} />
              :
              <div className="dyn_separator_cont"
                style={{
                  width: `${content?.dynamic_separator?.image?.width}%`,
                  minHeight: `${content?.dynamic_separator?.image?.height}px`,
                  zIndex: 99
                }}
              >
                {
                  content?.dynamic_separator?.image?.value &&
                  <Image fill src={content?.dynamic_separator?.image?.value ?? ""} alt="" style={{ objectFit: 'cover' }} />
                }

              </div>
          )

          }
        </div>
      ) : null}


    </>
  );
});
