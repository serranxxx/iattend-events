import { useRef, useState } from "react";
import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import styles from "./card.module.css";
import { Button } from "antd";
import Image from "next/image";
import { lighter } from "@/helpers/functions";
import { ImSpoonKnife } from "react-icons/im";
import { FaHotel } from "react-icons/fa";
import { MdArrowOutward, MdOpenInFull, MdSportsGymnastics } from "react-icons/md";
import FadeLeft from "@/components/Motion/FadeLeft";

type CardProps = {
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  invitationID: string | undefined;
};

export default function Card({ ui, invitation, invitationID }: CardProps) {
  const content = invitation.destinations;
  const slice = 6;

  const visibleCards = content.cards.slice(0, slice);
  const total = visibleCards.length;

  const primary = invitation.generals.colors.primary ?? "#FFF";
  const accent = invitation.generals.colors.accent ?? "#FFF";

  const [frontCard, setFrontCard] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);

  const [order, setOrder] = useState<number[]>(() => visibleCards.map((_, i) => i));

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const movedTouch = useRef<boolean>(false);
  const isAnimating = useRef<boolean>(false);
  const wheelAccumulator = useRef<number>(0);

  const SWIPE_THRESHOLD = 40;
  const WHEEL_THRESHOLD = 60;
  const ANIMATION_TIME = 350;

  const translateType = (type: string) => {
    switch (type) {
      case "hotel":
        return {
          label: ui?.labels.lodging,
          icon: <FaHotel size={10} style={{ color: "#FFF" }} />,
        };

      case "activitie":
        return {
          label: ui?.labels.activities,
          icon: <MdSportsGymnastics size={10} style={{ color: "#FFF" }} />,
        };

      case "food":
        return {
          label: ui?.labels.food,
          icon: <ImSpoonKnife size={10} style={{ color: "#000" }} />,
        };

      default:
        return {
          label: "",
          icon: null,
        };
    }
  };

  const bringToFront = (idx: number) => {
    if (total <= 1 || isAnimating.current) return;

    isAnimating.current = true;

    setOrder((prev) => [idx, ...prev.filter((x) => x !== idx)]);
    setFrontCard(idx);
    setFlipped(false);

    setTimeout(() => {
      isAnimating.current = false;
    }, ANIMATION_TIME);
  };

  const rotateForward = () => {
    if (total <= 1 || isAnimating.current) return;

    isAnimating.current = true;

    setOrder((prev) => {
      const next = [...prev.slice(1), prev[0]];
      setFrontCard(next[0]);
      return next;
    });

    setFlipped(false);

    setTimeout(() => {
      isAnimating.current = false;
    }, ANIMATION_TIME);
  };

  const rotateBackward = () => {
    if (total <= 1 || isAnimating.current) return;

    isAnimating.current = true;

    setOrder((prev) => {
      const next = [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)];
      setFrontCard(next[0]);
      return next;
    });

    setFlipped(false);

    setTimeout(() => {
      isAnimating.current = false;
    }, ANIMATION_TIME);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    movedTouch.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;

    if (Math.abs(touchDeltaX.current) > 10) {
      movedTouch.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    if (touchDeltaX.current <= -SWIPE_THRESHOLD) {
      // swipe hacia la izquierda
      rotateForward();
    } else if (touchDeltaX.current >= SWIPE_THRESHOLD) {
      // swipe hacia la derecha
      rotateBackward();
    }

    touchStartX.current = null;
    touchDeltaX.current = 0;

    setTimeout(() => {
      movedTouch.current = false;
    }, 50);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (total <= 1) return;

    // prioridad al desplazamiento horizontal real del trackpad/mouse
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    wheelAccumulator.current += delta;

    if (Math.abs(wheelAccumulator.current) < WHEEL_THRESHOLD) return;

    if (wheelAccumulator.current > 0) {
      rotateForward();
    } else {
      rotateBackward();
    }

    wheelAccumulator.current = 0;
  };

  const PERSPECTIVE = 900;
  const BASE_GAP = 36;
  const MAX_ROT = 7;
  const SCALE_STEP = 0.05;
  const DY_STEP = 4;

  const getPos = (rank: number, totalCards: number) => {
    if (totalCards <= 1) {
      return { dx: 0, dy: 0, rot: 0, scale: 1, z: 10 };
    }

    const center = (totalCards - 1) / 2;
    const offset = rank - center;
    const dist = Math.abs(offset);

    const dx = offset * BASE_GAP;
    const rot = center === 0 ? 0 : (offset / center) * MAX_ROT;
    const scale = 1 - dist * SCALE_STEP;
    const dy = dist * DY_STEP;
    const z = totalCards - rank + 5;

    return { dx, dy, rot, scale, z };
  };

  return (
    <div
      className="fan_container scroll-invitation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{
        position: "relative",
        maxWidth: "100vw",
        minWidth: "100vw",
        height: "340px",
        padding: "24px",
        boxSizing: "border-box",
        perspective: `${PERSPECTIVE}px`,
        touchAction: "pan-x",
        overflow: "hidden",
      }}
    >
      {visibleCards.map((card, i) => {
        const rank = order.indexOf(i);
        const { dx, dy, rot, scale, z } = getPos(rank, total);

        return (
          <FadeLeft
            key={i}
            zIndex={z}
            duration={i}
            start={-10 - i * 2}
            end={180 + -28 * i}
          >
            <div
              className={styles[card.type]}
              onClick={(e) => {
                e.stopPropagation();

                if (movedTouch.current || isAnimating.current) return;

                if (i === frontCard) {
                  setFlipped((prev) => !prev);
                } else {
                  bringToFront(i);
                }
              }}
              style={{
                position: "absolute",
                left: "50%",
                bottom: "53%",
                transform: `translate(-50%, 50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
                transformOrigin: "center",
                zIndex: z,
                transition: "transform .35s ease, z-index .35s ease",
                cursor: total > 1 ? "pointer" : "default",
              }}
            >
              <div
                className={`${styles.flip_card} ${
                  i === frontCard && flipped ? styles.flipped : ""
                }`}
              >
                <div className={styles.flip_inner}>
                  <div className={styles.flip_front}>
                    <div
                      className={styles.main_dest_card}
                      style={{
                        backgroundColor: lighter(primary, 0.9) ?? "#FFF",
                      }}
                    >
                      <div className={styles.image_dest_cont}>
                        <img
                          src={card.image!}
                          alt={card.name ?? ""}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />

                        <div className={styles.dest_text_box}>
                          <span
                            className={styles.dest_label}
                            style={{
                              color: lighter(primary, 0.9) ?? "#FFF",
                            }}
                          >
                            {card.name}
                          </span>
                        </div>

                        {invitationID !== "80d0c716-86e4-4c90-9e6d-9133d970d769" &&
                          frontCard === i && (
                            <Button
                              icon={<MdOpenInFull />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAnimating.current) return;
                                setFlipped((prev) => !prev);
                              }}
                              style={{
                                zIndex: 5,
                                fontSize: "12px",
                                fontWeight: 800,
                                backdropFilter: "blur(4px)",
                                boxShadow: "0px 0px 8px rgba(0,0,0,0.35)",
                                color: "#000",
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                height: "40px",
                                width: "40px",
                                transform: "translate(-50%,-50%)",
                              }}
                            />
                          )}

                        {invitationID !== "80d0c716-86e4-4c90-9e6d-9133d970d769" && (
                          <div className={styles.tag_label_container}>
                            <span className={styles.card_label_class}>
                              {translateType(card.type)?.label}
                            </span>
                            <span className={styles.card_icon_class}>
                              {translateType(card.type)?.icon}
                            </span>
                          </div>
                        )}
                      </div>

                      {invitation.generals.texture !== null && (
                        <div className={styles.card_texture}>
                          <Image
                            src={"/assets/textures/magzne.jpg"}
                            alt=""
                            fill
                            style={{
                              objectFit: "cover",
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={styles.flip_back}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAnimating.current) return;
                      setFlipped((prev) => !prev);
                    }}
                  >
                    <div
                      className={styles.main_dest_card}
                      style={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexDirection: "column",
                        padding: "12px",
                        backgroundColor: lighter(primary, 0.9) ?? "#FFF",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "flex-start",
                          flexDirection: "column",
                          gap: "6px",
                          color: accent,
                          maxHeight: "100%",
                          overflow: "auto",
                          paddingBottom: "6px",
                        }}
                      >
                        <span className={styles.reversed_card_title}>
                          <b>Información</b>
                        </span>

                        <span
                          className={styles.reversed_card_text}
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {card.description}
                        </span>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(card.url!, "_blank");
                        }}
                        icon={<MdArrowOutward />}
                        style={{
                          zIndex: 5,
                          fontSize: "12px",
                          fontWeight: 400,
                          backgroundColor: accent,
                          backdropFilter: "blur(10px)",
                          boxShadow: "0px 0px 4px rgba(0,0,0,0.1)",
                          color: lighter(primary, 0.9) ?? "#FFF",
                        }}
                      >
                        Navegar
                      </Button>

                      {invitation.generals.texture !== null && (
                        <div className={styles.card_texture}>
                          <Image
                            src={"/assets/textures/magzne.jpg"}
                            alt=""
                            fill
                            style={{
                              objectFit: "cover",
                              opacity: 1,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeLeft>
        );
      })}
    </div>
  );
}