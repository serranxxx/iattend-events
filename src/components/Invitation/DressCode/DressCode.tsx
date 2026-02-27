"use client";

import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import Image from "next/image";
import React, { forwardRef, useState } from "react";
import { Separador } from "../Separator/Separator";
import styles from "./dresscode.module.css";
import { Button } from "antd";
import { FaPinterest } from "react-icons/fa";
import FadeLeft from "@/components/Motion/FadeLeft";
import FadeIn from "@/components/Motion/FadeIn";

type DresscodeProps = {
  dev: boolean;
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
};

export const DressCode = forwardRef<HTMLDivElement, DresscodeProps>(function Greeting({ ui, dev, invitation }, ref) {
  const content = invitation.dresscode;
  const generals = invitation.generals;

  const images_src = dev ? content.dev : content.prod;

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


  return content.active && generals ? (
    <>
      <div ref={ref} className="main_container"
        style={{
          position: "relative",
          backgroundColor: content?.dynamic_background?.active ? secondary : "transparent",
          borderRadius: content?.dynamic_background?.border_radius,
          width: content?.dynamic_background?.active ? `${content.dynamic_background.width}%` : '100%',
          boxShadow: content?.dynamic_background?.active ? content?.dynamic_background?.shadow ? '0px 0px 12px rgba(0,0,0,0.4)' : '0px 0px 0px rgba(0,0,0,0)' : '0px 0px 0px rgba(0,0,0,0)'
        }}>

        <div className="g_module_info_container">
          <FadeLeft>
            <span
              className="g_module_title"
              style={{
                display: "inline-block", whiteSpace: "pre-line",
                color: content?.inverted ? primary : title.color,
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
                color: content?.inverted ? primary : accent,
                fontFamily: body.font ?? "Poppins",
                fontWeight: body.weight, opacity: body.opacity
              }}
            >
              {renderTextWithStrong(content?.description ?? "")}
            </span>
          </FadeLeft>

          {content?.colors && content.colors.length > 0 && (
            <FadeIn>
              <div className={styles.color_palette_cont}>

                <div className={styles.dresscode_colors}>
                  {content.colors.map((color, index) => (
                    <div
                      key={index}
                      className={styles.dresscode_color}
                      style={{ borderColor: content?.background ? secondary : primary, backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {content.images_active && (
            <div className={styles.scroll_invitation} style={{ zIndex: 2 }}>
              {images_src.map((image, index) => (
                <FadeIn key={index}>
                  <div
                    style={{ position: "relative", padding: "6px 24px" }}
                    key={index}
                    className={styles.dresscode_image_container}
                  >
                    {
                      image &&
                      <Image fill alt="" loading="lazy" src={image} style={{ objectFit: "cover" }} />

                    }
                  </div>
                </FadeIn>
              ))}
            </div>
          )}

          {content?.links_active && (
            <div className={dev ? "dresscode-links-dev" : "dresscode-links"}>
              {content.links &&
                content.links.map((link, index) => (
                  <FadeIn key={index}>
                    <Button
                      key={index}
                      href={link}
                      target="_blank"
                      icon={<FaPinterest />}
                      style={{
                        backgroundColor: content?.dynamic_background?.active ? (content?.inverted ? primary : secondary) : primary,
                        color: accent,
                        // backgroundColor: "#E60024",
                        // color: "#FFF",
                        boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {ui?.buttons.inspiration ?? "HOLA"}
                    </Button>
                  </FadeIn>
                ))}
            </div>
          )}
        </div>
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
    </>
  ) : null;
});
