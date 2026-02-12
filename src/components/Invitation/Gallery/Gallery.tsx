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
    color: invitation?.generals.fonts.titles?.color === '#000000' ? accent : (invitation?.generals.fonts.titles?.color ?? accent )
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
        <div className="main_container" style={{ position: "relative", width: "100%" }}>
          <div className="textures_background" style={{ backgroundColor: content.background ? secondary : "transparent" }} />
          <div
            ref={ref}
            className="gm_container"
            style={{
              padding: content.background ? "32px" : "0px",
              position: "relative",
            }}
          >
            <div className="g_module_info_container" style={{
              // width:'auto'
            }}>
              <FadeLeft>
                <span
                  className="g_module_title"
                  style={{
                    display: "inline-block", whiteSpace: "pre-line",
                    color: content.background && content.inverted ? primary : title.color,
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
          </div>
        </div>
      )}
      {content?.separator && <Separador generals={generals} value={generals?.separator ?? 1} />}
    </>
  );
});
