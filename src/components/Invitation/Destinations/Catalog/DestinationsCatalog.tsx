"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaHotel } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { MdArrowOutward, MdSportsGymnastics } from "react-icons/md";
import { DestinationCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { getWebCopy } from "../../layout/copy";
import web from "../../layout/web-section.module.css";
import styles from "./catalog.module.css";

type DestinationType = DestinationCard["type"];

type CatalogProps = {
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  textColor: string;
};

// Mismo tope que el abanico móvil.
const SLICE = 6;

const TYPE_STYLE: Record<DestinationType, { w: number; h: number; chip: string; icon: React.ReactNode }> = {
  hotel: { w: 240, h: 400, chip: "#06AEFF", icon: <FaHotel size={10} color="#FFF" /> },
  activitie: { w: 240, h: 330, chip: "#35AE40", icon: <MdSportsGymnastics size={10} color="#FFF" /> },
  // Proporción cuadrada del móvil (170×170) escalada al ancho web.
  food: { w: 240, h: 240, chip: "#FDD00E", icon: <ImSpoonKnife size={10} color="#000" /> },
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Destinos en web: el abanico de móvil con la tarjeta al frente en el centro,
 * y una barra de detalle que reemplaza el expandir + voltear.
 */
export default function DestinationsCatalog({ invitation, ui, textColor }: CatalogProps) {
  const cards = invitation.destinations.cards.slice(0, SLICE);
  const { primary, accent } = invitation.generals.colors;
  const bodyFont = invitation.generals.fonts.body?.typeFace;
  const copy = getWebCopy(ui);

  const labelFor = (type: DestinationType) =>
    type === "hotel" ? ui?.labels.lodging : type === "activitie" ? ui?.labels.activities : ui?.labels.food;

  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [stageW, setStageW] = useState(700);
  const stageRef = useRef<HTMLDivElement>(null);

  // Si el organizador cambia el número de tarjetas (preview en vivo) se reinicia el orden.
  useEffect(() => {
    setOrder(cards.map((_, i) => i));
  }, [cards.length]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setStageW(Math.round(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = order.filter((i) => i < cards.length);
  const total = visible.length;
  const front = visible[0];
  const active = front !== undefined ? cards[front] : undefined;

  const rotate = (dir: 1 | -1) => {
    setOrder((prev) => {
      const vis = prev.filter((i) => i < cards.length);
      if (vis.length < 2) return prev;
      const mover = dir > 0 ? vis[0] : vis[vis.length - 1];
      const rest = prev.filter((x) => x !== mover);
      return dir > 0 ? [...rest, mover] : [mover, ...rest];
    });
  };

  const bringToFront = (i: number) => setOrder((prev) => [i, ...prev.filter((x) => x !== i)]);

  const maxOff = Math.max(1, Math.ceil((total - 1) / 2));
  const gap = Math.max(60, Math.min(170, (stageW - 250) / (2 * maxOff)));

  const arrowStyle = { borderColor: `${textColor}80`, color: textColor, background: "transparent", "--hover-bg": `${textColor}26` } as React.CSSProperties;

  return (
    <>
      <div ref={stageRef} className={styles.stage}>
        {cards.map((card, i) => {
          const rank = visible.indexOf(i);
          const shown = rank >= 0;
          const offset = shown ? (rank === 0 ? 0 : (rank % 2 ? 1 : -1) * Math.ceil(rank / 2)) : 0;
          const dist = Math.abs(offset);
          const T = TYPE_STYLE[card.type] ?? TYPE_STYLE.activitie;
          return (
            <div
              key={i}
              className={styles.card}
              onClick={() => shown && i !== front && bringToFront(i)}
              style={{
                width: T.w,
                height: T.h,
                transform: shown
                  ? `translate(-50%, -50%) translate(${offset * gap}px, ${dist * 14}px) rotate(${offset * 5}deg) scale(${1 - dist * 0.08})`
                  : "translate(-50%, -50%) translateY(40px) scale(0.85)",
                zIndex: shown ? 20 - dist : 0,
                opacity: shown ? 1 : 0,
                pointerEvents: shown ? "auto" : "none",
                cursor: i === front ? "default" : "pointer",
              }}
            >
              <div className={styles.frame}>
                <div className={styles.photo}>
                  {card.image && <Image fill sizes="240px" alt={card.name ?? ""} src={card.image} style={{ objectFit: "cover" }} />}
                  <div className={styles.vignette} />
                  <span className={styles.card_name} style={{ fontFamily: bodyFont }}>{card.name}</span>
                  <div className={styles.card_tag}>
                    <span className={styles.card_label} style={{ fontFamily: bodyFont }}>{labelFor(card.type)}</span>
                    <span className={styles.icon_chip} style={{ background: T.chip }}>{T.icon}</span>
                  </div>
                  <div className={styles.dim} style={{ opacity: shown ? dist * 0.12 : 0 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <div className={styles.detail} style={{ borderColor: `${textColor}59`, color: textColor }}>
          <div className={styles.detail_info}>
            <div className={styles.detail_meta}>
              <span>{`${pad(1)} / ${pad(total)}`}</span>
              <span className={styles.detail_rule} style={{ background: `${textColor}80` }} />
              <span className={styles.icon_chip} style={{ background: TYPE_STYLE[active.type]?.chip }}>
                {TYPE_STYLE[active.type]?.icon}
              </span>
              <span>{labelFor(active.type)}</span>
            </div>
            <span className={styles.detail_name} style={{ fontFamily: bodyFont }}>{active.name}</span>
            {active.description && (
              <p className={styles.detail_description} style={{ fontFamily: bodyFont }}>{active.description}</p>
            )}
          </div>

          <div className={styles.detail_actions}>
            <button type="button" className={`${web.round_btn} ${styles.detail_arrow}`} style={arrowStyle} onClick={() => rotate(-1)} aria-label={copy.previous}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className={`${web.round_btn} ${styles.detail_arrow}`} style={arrowStyle} onClick={() => rotate(1)} aria-label={copy.next}>
              <ChevronRight size={18} />
            </button>
            {active.url && (
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${web.pill_btn} ${styles.navigate}`}
                style={{ background: accent ?? "#000", color: primary ?? "#FFF", fontWeight: 400 }}
              >
                <MdArrowOutward size={16} />
                {copy.navigate}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
