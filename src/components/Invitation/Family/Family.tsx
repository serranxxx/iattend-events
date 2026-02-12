import { NewInvitation } from "@/types/new_invitation";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import FadeLeft from "@/components/Motion/FadeLeft";
import { lighter } from "@/helpers/functions";

type peopleProps = {
  dev: boolean;
  invitation: NewInvitation;
  invitationID?: string;
};

export const People = forwardRef<HTMLDivElement, peopleProps>(function Greeting({ dev, invitation, invitationID }, ref) {
  const content = invitation?.people;
  const generals = invitation?.generals;

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


  return (
    <>
      {content?.active && generals.colors ? (
        <div className="main_container" style={{ position: "relative", width: "100%" }}>
          <div className="textures_background" style={{ backgroundColor: content.background ? secondary : "transparent" }} />

          <FadeLeft>
            <div
              ref={ref}
              className="gm_container"
              style={{
                padding: content.background ? "24px" : "0px 24px",
                position: "relative",
              }}
            >
              <div className="g_module_info_container">
                <span
                  // data-aos={!dev && generals.texture == null ? "fade-right" : undefined}
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

                {content.personas
                  ? content.personas.map((persona, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        flexDirection: "column",
                        gap: "0px",
                        alignSelf: "stretch",
                      }}
                    >
                      <FadeLeft>
                        <div
                          key={index}
                          className="g_module_items_single_col"
                          style={{ flexDirection: invitationID === "80d0c716-86e4-4c90-9e6d-9133d970d769" ? "column-reverse" : undefined, }}
                        >
                          <span
                            className="g_mdoule_light_text"
                            style={{
                              display: "inline-block", whiteSpace: "pre-line",
                              color: content.background && content.inverted ? primary : lighter(accent, 0.4) ?? "#000",
                              fontFamily: body.font ?? "Poppins",
                              fontWeight: body.weight, opacity: body.opacity
                            }}
                          >
                            {persona.title}
                          </span>

                          <span
                            className="g_mdoule_regular_text"
                            style={{
                              display: "inline-block", whiteSpace: "pre-line",
                              color: content.background && content.inverted ? primary : accent,
                              fontFamily: body.font ?? "Poppins",
                              fontWeight: body.weight, opacity: body.opacity
                            }}
                          >
                            {persona.description}
                          </span>
                        </div>
                      </FadeLeft>
                    </div>
                  ))
                  : null}
              </div>
            </div>
          </FadeLeft>

        </div>
      ) : null}

      {content?.separator && <Separador generals={generals} value={generals?.separator ?? 1} />}
    </>
  );
});
