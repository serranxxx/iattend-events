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


  return content.active && generals ? (
    <>
      <div
        className="main_container"
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: content.separator ? "12px" : content.separator && content.background ? "36px" : undefined,
        }}
      >
        <div className="textures_background" style={{ backgroundColor: content.background ? secondary : "transparent", }} />
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

            {content.colors && content.colors.length > 0 && (
              <FadeIn>
                <div className={styles.color_palette_cont}>

                  <div className={styles.dresscode_colors}>
                    {content.colors.map((color, index) => (
                      <div
                        key={index}
                        className={styles.dresscode_color}
                        style={{ borderColor: content.background ? secondary : primary, backgroundColor: color }}
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
                      <Image fill alt="" loading="lazy" src={image} style={{ objectFit: "cover" }} />
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}

            {content.links_active && (
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
                          backgroundColor: content.background ? (content.inverted ? primary : secondary) : primary,
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
        </div>
      </div>

      {content.separator && <Separador generals={generals} value={generals.separator} />}
    </>
  ) : null;
});
