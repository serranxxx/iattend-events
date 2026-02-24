import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import React, { forwardRef } from "react";
import { Separador } from "../Separator/Separator";
import styles from "./itinerary.module.css";
import Card from "./Card/Card";
import OpenCard from "./OpenCard/OpenCard";
import { Button } from "antd";
import { FaDiamondTurnRight } from "react-icons/fa6";
import Image from "next/image";

type quoteProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui: InvitationUIBundle;
  invitationID: string | undefined;
};

export const Itinerary = forwardRef<HTMLDivElement, quoteProps>(function Greeting({ ui, dev, invitation, invitationID }, ref) {
  const content = invitation.itinerary;
  const generals = invitation.generals;

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



  // useEffect(() => {
  //   AOS.init({
  //     duration: 900,       // duración de las animaciones (en ms)
  //     once: true,          // si se anima solo la primera vez
  //     easing: 'ease-out',  // tipo de easing
  //   });
  // }, []);

  return (
    <>
      {content.active && generals ? (
        <div ref={ref} className="main_container"
          style={{
            position: "relative",
            backgroundColor: content.dynamic_background.active ? secondary : "transparent",
            borderRadius: content.dynamic_background.border_radius,
            width: content.dynamic_background.active ? `${content.dynamic_background.width}%` : '100%',
            boxShadow: content.dynamic_background.active ? content.dynamic_background.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)',
            minWidth:'85%'
          }}>

          <div className="g_module_info_container">
            <span
              // data-aos={!dev && generals.texture == null ? "fade-right" : undefined}
              className="g_module_title"
              style={{
                color: content.dynamic_background.active ? (content.inverted ? primary : title.color) : title.color,
                display: "inline-block", whiteSpace: "pre-line",
                fontFamily: title.font ?? "Poppins",
                fontSize: title.size, fontWeight: title.weight, opacity: title.opacity
              }}
            >
              {content.title}
            </span>
            <div
              // data-aos={!dev && generals.texture == null ? "fade-right" : undefined}
              className={styles.itinerary_cards_container}
            >
              {
                invitationID === "80d0c716-86e4-4c90-9e6d-9133d970d769"
                  ? <div className={styles.extra_card} style={{ backgroundColor: secondary }}>
                    <OpenCard dev={dev} invitation={invitation} item={invitation.itinerary.object[0]} />
                    <Button
                      href={invitation.itinerary.object[0].address?.url ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<FaDiamondTurnRight size={14} />}
                      style={{
                        background: '#FFFFFF80',
                        backdropFilter: 'blur(10px)',
                        color: primary,
                        position: 'absolute', top: '24px', right: '24px'
                      }}
                    >
                      {ui?.buttons.directions}
                    </Button>
                  </div>
                  : <Card ui={ui} invitation={invitation} dev={dev} />
              }

            </div>
          </div>
          {content?.dynamic_separator.active && (
            content.dynamic_separator.type === 'single' ?
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
