import { NewInvitation } from "@/types/new_invitation";
import Image from "next/image";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import FadeIn from "@/components/Motion/FadeIn";
import { darker } from "@/helpers/functions";

type quoteProps = {
  dev: boolean;
  invitation: NewInvitation;
};

export const Quote = forwardRef<HTMLDivElement, quoteProps>(function Greeting({ dev, invitation }, ref) {
  const content = invitation.quote;
  const generals = invitation.generals;

  const image_src = dev ? content.image.dev : content.image.prod;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";

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
      {content.active ? (
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            backgroundColor: content?.dynamic_background?.active ? secondary : "transparent",
            borderRadius: content?.dynamic_background?.border_radius,
            width: content?.dynamic_background?.active ? `${content.dynamic_background.width}%` : '100%',
            boxShadow: content?.dynamic_background?.active ? content.dynamic_background.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            padding: content?.image?.active ? 0 : '24px',
           
          }}>

          {content.image.active ? (
            <FadeIn>
              <div className="background_image_quote_container" style={{
                borderRadius: content?.dynamic_background?.border_radius,
              }}>
                <div style={{ backgroundColor: primary, height: "100%", width: "100%" }}>
                  {image_src && <Image fill style={{ objectFit: "cover" }} loading="lazy" decoding="async" alt="" src={image_src} />}
                </div>

                {content.text.shadow && (
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
                    justifyContent: "center",
                    lineHeight: '1.4'
                  }}
                >
                  <span
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
                  >
                    {renderTextWithStrong(content.text.font.value ?? "")}
                  </span>
                </div>
              </div>
            </FadeIn>
          ) : (
            <span
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
            >
              {renderTextWithStrong(content.text.font.value ?? "")}
            </span>
          )}

          {content?.dynamic_separator?.active && (
            content?.dynamic_separator?.type === 'single' ?
              <Separador inverted={content.inverted} generals={generals} value={content?.dynamic_separator.single.value ?? 1} />
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
      ) : (
        <></>
      )}
    </>
  );
});
