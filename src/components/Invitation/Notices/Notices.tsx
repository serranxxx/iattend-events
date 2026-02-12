import { NewInvitation } from "@/types/new_invitation";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import FadeLeft from "@/components/Motion/FadeLeft";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
};

export const Notices = forwardRef<HTMLDivElement, DresscodeProps>(function notices({ dev, invitation }, ref) {
  const content = invitation.notices;
  const generals = invitation.generals;


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


  return (
    <>
      {content.active && generals ? (
        <div className="main_container" style={{ position: "relative", width: "100%" }}>
          <div className="textures_background" style={{ backgroundColor: content.background ? secondary : "transparent" }} />
          <div
            ref={ref}
            className="gm_container"
            style={{
              padding: content.background ? "24px" : "0px 24px",
              position: "relative",
            }}
          >
            <div className="g_module_info_container">
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
                  {content.title}
                </span>
              </FadeLeft>

              {content.notices &&
                content.notices.map((item, index) => (
                  <div key={index} className="g_module_items_single_col" style={{ gap: "12px" }}>
                    <FadeLeft>
                      <span
                        className="g_mdoule_regular_text"
                        style={{
                          display: "inline-block", whiteSpace: "pre-line",
                          color: content.background && content.inverted ? primary : accent,
                          fontFamily: body.font ?? "Poppins",
                          fontWeight: body.weight, opacity: body.opacity
                        }}
                      >
                        {renderTextWithStrong(item ?? "")}
                      </span>
                    </FadeLeft>

                    {index < content.notices.length - 1 && (
                      <FadeLeft>
                        <span
                          // data-aos={!dev && generals.texture == null ? "fade-left" : undefined}
                          className="g_mdoule_regular_text"
                          style={{
                            display: "inline-block", whiteSpace: "pre-line",
                            color: content.background && content.inverted ? primary : accent,
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
            </div>
          </div>
        </div>
      ) : null}
      {content?.separator && <Separador generals={generals} value={generals?.separator ?? 1} />}
    </>
  );
});
