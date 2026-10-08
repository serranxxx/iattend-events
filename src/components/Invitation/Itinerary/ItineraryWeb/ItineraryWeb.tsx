"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button, Drawer } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaDiamondTurnRight } from "react-icons/fa6";
import { InvitationUIBundle, ItineraryItem, NewInvitation } from "@/types/new_invitation";
import { buttonsColorText, lighter } from "@/helpers/functions";
import OpenCard from "../OpenCard/OpenCard";
import { getWebCopy } from "../../layout/copy";
import web from "../../layout/web-section.module.css";
import styles from "./itinerary-web.module.css";

type ItineraryWebProps = {
  invitation: NewInvitation;
  ui: InvitationUIBundle;
  dev: boolean;
  textColor: string;
  title: React.ReactNode;
};

const GAP = 32;

const formatAddress = (address?: ItineraryItem["address"]) =>
  address
    ? [[address.street, address.number].filter(Boolean).join(" "), address.neighborhood, address.city]
      .filter(Boolean)
      .join(", ")
    : "";

/** Itinerario en web: tarjetas de 2 en 2 con scroll horizontal y flechas si hay más de 2. */
export default function ItineraryWeb({ invitation, ui, dev, textColor, title }: ItineraryWebProps) {
  const content = invitation.itinerary;
  const { primary, secondary, accent, actions } = invitation.generals.colors;
  const copy = getWebCopy(ui);
  const steps = content.object ?? [];
  const scrollable = steps.length > 2;
  const muted = lighter(textColor, 0.4) ?? textColor;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<ItineraryItem | null>(null);

  // Una tarjeta = la mitad del ancho visible más medio gap.
  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: (dir * (el.clientWidth + GAP)) / 2, behavior: "smooth" });
  };

  const arrowStyle = {
    background: primary ?? "#FFF",
    color: accent ?? "#000",
    borderColor: `${accent}30`,
    "--hover-bg": actions ?? "#FFF",
  } as React.CSSProperties;

  return (
    <>
      <div className={web.header_row}>
        <span />
        {title}
        {scrollable ? (
          <div className={web.header_side}>
            <button type="button" className={web.round_btn} style={arrowStyle} onClick={() => scrollByCard(-1)} aria-label={copy.previous}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className={web.round_btn} style={arrowStyle} onClick={() => scrollByCard(1)} aria-label={copy.next}>
              <ChevronRight size={18} />
            </button>
          </div>
        ) : <span />}
      </div>

      <div ref={scrollerRef} className={styles.scroller}>
        {steps.map((item, index) => (
          <div key={index} className={styles.card} style={{ color: textColor, fontFamily: invitation.generals.fonts.body?.typeFace }}>
            <div className={styles.time_row}>
              <span className={styles.dot} style={{ background: textColor }} />
              {item.time && <span className={styles.time}>{item.time}</span>}
              <span className={styles.rule} style={{ background: `${textColor}20` }} />
            </div>

            {item.image && (
              <div className={styles.image} style={{ background: `${secondary}30` }}>
                <Image fill sizes="(min-width: 768px) 30vw, 100vw" alt="" src={item.image} style={{ objectFit: "cover" }} />
              </div>
            )}

            <div className={styles.info}>
              <span className={styles.name}>{item.name}</span>
              {item.subtext && <span className={styles.subtext} style={{ color: muted }}>{item.subtext}</span>}
              {formatAddress(item.address) && (
                <span className={styles.address} style={{ color: muted }}>{formatAddress(item.address)}</span>
              )}
            </div>

            <div className={styles.actions}>
              {item.address?.url && (
                <a
                  href={item.address.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={web.pill_btn}
                  style={{ background: actions ?? "#FFF", color: accent ?? "#000" }}
                >
                  {ui?.buttons.directions}
                </a>
              )}
              <button
                type="button"
                onClick={() => setOpen(item)}
                className={web.pill_btn}
                style={{ borderColor: `${textColor}30`, color: textColor, fontWeight: 400 }}
              >
                {ui?.buttons.details}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mismo Drawer que en móvil, desde la izquierda en pantallas grandes */}
      <Drawer
        placement="left"
        onClose={() => setOpen(null)}
        open={Boolean(open)}
        classNames={{ body: "scroll-invitation" }}
        title={
          <div style={{ fontFamily: invitation.generals.fonts.body?.typeFace, fontSize: "20px", color: content.inverted ? primary! : accent! }}>
            {open?.name}
          </div>
        }
        closeIcon={false}
        style={{ maxHeight: "100vh", borderRadius: "0px 32px 32px 0px" }}
        styles={{
          header: { backgroundColor: (content.inverted ? secondary : primary) ?? "#FFF" },
          body: { backgroundColor: (content.inverted ? secondary : primary) ?? "#FFF", paddingTop: "12px" },
        }}
        extra={
          open?.address?.url && (
            <Button
              href={open.address.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<FaDiamondTurnRight size={14} />}
              style={{
                background: content.inverted ? primary! : actions ?? "#FFF",
                color: content.inverted ? accent! : buttonsColorText(actions ?? "#FFFFFF"),
              }}
            >
              {ui?.buttons.directions}
            </Button>
          )
        }
      >
        {open && <OpenCard dev={dev} invitation={invitation} item={open} />}
      </Drawer>
    </>
  );
}
