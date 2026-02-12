import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import React, { forwardRef, useEffect } from "react";
import Card from "./Card/Card";
import { Separador } from "../Separator/Separator";
import FadeLeft from "@/components/Motion/FadeLeft";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  invitationID: string | undefined;
};

export const Destinations = forwardRef<HTMLDivElement, DresscodeProps>(function destinations({ ui, dev, invitation, invitationID }, ref) {
  const content = invitation.destinations;
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


  // useEffect(() => {
  //   AOS.init({
  //     duration: 900, // duración de las animaciones (en ms)
  //     once: true, // si se anima solo la primera vez
  //     easing: "ease-out", // tipo de easing
  //   });
  // }, []);

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
            //    data-aos={!dev ? 'fade-left' : undefined}
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
                  {renderTextWithStrong(content.title ?? "")}
                </span>
              </FadeLeft>

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
                  {renderTextWithStrong(content.description ?? "")}
                </span>
              </FadeLeft>
              <div
                style={{
                  overflow: "hidden", maxWidth: '450px',
                  // display:'flex',alignItems:'center',justifyContent:'flex-start'
                }}
              // className="scroll_invitation"
              >
                {
                  invitation.destinations.cards.length > 0 &&
                  <Card invitationID={invitationID} invitation={invitation} ui={ui} />
                }
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {content?.separator && <Separador generals={generals} value={generals?.separator ?? 1} />}
    </>
  );
});
