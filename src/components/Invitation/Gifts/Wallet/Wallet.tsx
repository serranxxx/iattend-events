"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./wallet.module.css";
import { GiftCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { darker } from "@/helpers/functions";
import Image from "next/image";
import { classifyGiftCard } from "./classifyGiftCard";
import { Button, message } from "antd";
import { MdArrowOutward } from "react-icons/md";
import { FaCopy } from "react-icons/fa";
import FadeIn from "@/components/Motion/FadeIn";
import FadeDown from "@/components/Motion/FadeDown";
import { useScreenWidth } from "@/hooks/useScreenWidth";

type CardProps = {
  invitation: NewInvitation;
  dev?: boolean;
  ui: InvitationUIBundle;
};

export default function Wallet({ ui, invitation, dev = false }: CardProps) {
  const [base, setBase] = useState<number[]>([]);
  const baseRef = useRef<number[]>([]);
  const [bottoms, setBottoms] = useState<number[]>([]);
  const [cards, setCards] = useState<GiftCard[] | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const content = invitation.gifts;
  const accent = invitation.generals?.colors?.accent ?? "#FFFFFF";
  const primary = invitation.generals?.colors?.primary ?? "#FFFFFF";
  const secondary = invitation.generals?.colors?.secondary ?? "#FFFFFF";
  const fontFamily = invitation.generals.fonts.body?.typeFace;
  const title = invitation.cover.title.text.value;

  const width = useScreenWidth();
  const isLargeScreen = width >= 768;

  const ANIM_MS = 250; // duración de cada fase (match con CSS)
  const SCALE_UP = 1.2; // escala al abrir
  const DOWN_PX = 50; // “bajar” después de subir

  const [movedIndex, setMovedIndex] = useState<number | null>(null);
  const [isScaled, setIsScaled] = useState(false);

  // ---- Control de animaciones y timeouts ----
  const timeoutsRef = useRef<number[]>([]);
  const animatingRef = useRef(false);

  function clearAllTimeouts() {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }
  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  }

  useEffect(() => {
    return () => {
      // cleanup al desmontar
      clearAllTimeouts();
    };
  }, []);

  // ---- Lógica de abrir/cerrar aislada ----
  const openCard = (index: number) => {
    const h = ref.current?.clientHeight ?? 340;
    const jump = Math.max(160, Math.min(600, h - 10));

    setBottoms(() => {
      const next = [...baseRef.current];
      next[index] = jump; // sube
      return next;
    });

    setMovedIndex(index);

    // después de subir, aplicar scale y “bajada”
    schedule(() => {
      setIsScaled(true);
    }, ANIM_MS);
  };

  const closeCurrent = () => {
    setIsScaled(false);
    schedule(() => {
      setBottoms(baseRef.current);
      setMovedIndex(null);
    }, ANIM_MS);
  };

  const handleClick = (index: number) => {
    // evitar reentradas durante animación
    if (animatingRef.current) return;

    // cancelar orquestaciones previas
    clearAllTimeouts();
    animatingRef.current = true;

    // A) click sobre la misma → cerrar
    if (movedIndex === index) {
      closeCurrent();
      schedule(() => {
        animatingRef.current = false;
      }, ANIM_MS + 5);
      return;
    }

    // B) hay otra abierta → cerrar y luego abrir la nueva
    if (movedIndex !== null && movedIndex !== index) {
      setIsScaled(false);
      schedule(() => {
        setBottoms(baseRef.current);
        setMovedIndex(null);
        // pequeña espera para asegurar re-render antes de abrir
        schedule(() => {
          openCard(index);
          schedule(() => {
            animatingRef.current = false;
          }, ANIM_MS + 5);
        }, 20);
      }, ANIM_MS);
      return;
    }

    // C) no hay abierta → abrir directo
    openCard(index);
    schedule(() => {
      animatingRef.current = false;
    }, ANIM_MS + 5);
  };

  const handleReset = () => {
    // cerrar si hay una abierta
    clearAllTimeouts();
    if (movedIndex !== null) {
      animatingRef.current = true;
      setIsScaled(false);
      schedule(() => {
        setBottoms(baseRef.current);
        setMovedIndex(null);
        animatingRef.current = false;
      }, ANIM_MS);
    }
  };

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      messageApi.info("Número de cuenta copiado");
    } catch (err) {
      console.error("Error al copiar el texto: ", err);
    }
  };

  // ---- Inicialización de base según cantidad de tarjetas ----
  useEffect(() => {
    if (invitation) {
      const sliced = invitation.gifts.cards.slice(0, 3);
      switch (sliced.length) {
        case 1:
          setBase([94]);
          break;
        case 2:
          setBase([54, 94]);
          break;
        case 3:
          setBase([14, 54, 94]);
          break;
        default:
          setBase([]);
          break;
      }
    }
  }, [invitation]);

  // mantener baseRef sincronizada y setear bottoms
  useEffect(() => {
    baseRef.current = base;
    setBottoms(base);
  }, [base]);

  // setear tarjetas visibles
  useEffect(() => {
    if (invitation) {
      setCards(invitation.gifts.cards.slice(0, 3));
    }
  }, [invitation]);

  return (
    <>
      {contextHolder}
      <FadeIn>
        <div
          ref={ref}
          className={invitation.generals.texture !== null ? styles.wallet : styles.wallet_light}
          style={{
            backgroundColor:
              darker(content.background ? (content.inverted ? primary : secondary) : content.inverted ? secondary : primary, 0.95) ??
              "#FFF",
            transform: `scale(${!isLargeScreen ? "0.7" : "0.9"})`,
            marginTop: isLargeScreen ? "28px" : undefined,
          }}
        >
          {bottoms.length > 0 &&
            cards?.map((card, index) => (
              <FadeDown
                key={`${classifyGiftCard(card).className}-${index}`} // ✅ key para estabilidad en el render
                duration={index}
                zIndex={movedIndex === index ? 12 : cards.length + 1 - index}
              >
                <div
                  className={`${styles.card} ${styles[classifyGiftCard(card).className]}`}
                  style={{
                    zIndex: movedIndex === index ? 12 : cards.length + 1 - index,
                    bottom: `${bottoms[index]}px`,
                    padding: movedIndex === index ? "24px" : undefined,
                    border: `1px solid ${accent}10`,
                    transition: "bottom 250ms ease, transform 250ms ease",
                    transform:
                      movedIndex === index
                        ? isScaled
                          ? `scale(${SCALE_UP}) translateY(${DOWN_PX}px)`
                          : "scale(1) translateY(0)"
                        : "scale(1) translateY(0)",
                    transformOrigin: "center bottom",
                  }}
                  onClick={() => handleClick(index)}
                >
                  <div
                    className={styles.card_logo_container}
                    style={{
                      height: movedIndex === index ? "24px" : undefined,
                    }}
                  >
                    <img src={classifyGiftCard(card).imageUrl ?? ""} alt="" style={{ height: "100%", objectFit: "cover" }} />
                  </div>

                  {card.kind === "store" ? (
                    <div className={styles.wallet_col} style={{ gap: "6px" }}>
                      <span>{ui.labels.DiscoverGifts}</span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(card.url!, "_blank");
                        }}
                        className={styles.cta_button}
                        icon={<MdArrowOutward />}
                      >
                        {ui.labels.seeGifts}
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.wallet_col} style={{ gap: "6px" }}>
                      <span>{card.name}</span>
                      <span>
                        {card.number}{" "}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(card.number!);
                          }}
                          icon={<FaCopy style={{ color: "#FFF" }} />}
                          type="text"
                        />
                      </span>
                    </div>
                  )}
                </div>
              </FadeDown>
            ))}

          {/* Lines debajo y sin eventos */}
          <div
            onClick={handleReset}
            style={{
              backgroundColor:
                darker(content.background ? (content.inverted ? primary : secondary) : content.inverted ? secondary : primary, 0.95) ??
                "#FFF",
              borderColor: content.inverted ? `${accent}60` : `${primary}60`,
            }}
            className={`${invitation.generals.texture !== null ? styles.department : styles.department_light} ${styles.one}`}
          >
            <div className={styles.wallet_col} style={{ fontFamily: fontFamily }}>
              <span
                style={{ color: content.background ? (content.inverted ? accent : primary) : content.inverted ? primary : accent }}
                className={styles.wallet_label}
              >
                {title}
              </span>
              <span
                style={{ color: content.background ? (content.inverted ? accent : primary) : content.inverted ? primary : accent }}
                className={styles.wallet_sec_label}
              >
                {ui.labels.cards}
              </span>
            </div>
          </div>
        </div>
      </FadeIn>
    </>
  );
}
