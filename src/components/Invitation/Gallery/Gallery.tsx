import { NewInvitation } from "@/types/new_invitation";
import Image from "next/image";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import styles from "./gallery.module.css";
import FanStack from "./FanStack";
import FadeLeft from "@/components/Motion/FadeLeft";
import FadeIn from "@/components/Motion/FadeIn";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
};

export const Gallery = forwardRef<HTMLDivElement, DresscodeProps>(function gallery({ dev, invitation }, ref) {
  const content = invitation.gallery;
  const generals = invitation.generals;

  const images = dev ? content.dev : content.prod;

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

  const renderTextWithStrong = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {content.active && generals && (
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            backgroundColor: content?.dynamic_background?.active ? secondary : "transparent",
            borderRadius: content?.dynamic_background?.border_radius,
            width: content?.dynamic_background?.active ? `${content.dynamic_background.width}%` : '100%',
            boxShadow: content?.dynamic_background?.active ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)'
          }}>
          <div className="g_module_info_container" style={{
            // width:'auto'
          }}>
            <FadeLeft>
              <span
                className="g_module_title"
                style={{
                  display: "inline-block", whiteSpace: "pre-line",
                  color: content.inverted ? primary : title.color,
                  fontFamily: title.font ?? "Poppins",
                  fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
                }}
              >
                {renderTextWithStrong(content.title ?? "")}
              </span>
            </FadeLeft>
            {
              images?.length > 0 &&
              <FadeIn>
                <FanStack
                  images={images}
                  radius={12}
                  invitation={invitation}
                />
              </FadeIn>
            }
          </div>
          {content?.dynamic_separator?.active && (
            content?.dynamic_separator?.type === 'single' ?
              <Separador inverted={content.inverted} generals={generals} value={content?.dynamic_separator?.single?.value ?? 1} />
              :
              <div className="dyn_separator_cont"
                style={{
                  width: `${content?.dynamic_separator.image.width}%`,
                  minHeight: `${content?.dynamic_separator.image.height}px`,
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
      )}
    </>
  );
});
