import { useEffect, useRef, useState } from "react";
import { InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import styles from "./card.module.css";
import { Button } from "antd";
import Image from "next/image";
import { darker, lighter } from "@/helpers/functions";
import { useFitText } from "./useFitText";
import { ImSpoonKnife } from "react-icons/im";
import { FaHotel } from "react-icons/fa";
import { MdArrowOutward, MdOpenInFull, MdSportsGymnastics } from "react-icons/md";
import FadeIn from "@/components/Motion/FadeIn";
import FadeLeft from "@/components/Motion/FadeLeft";



type CardProps = {
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  invitationID: string | undefined;
};

export default function Card({ ui, invitation, invitationID }: CardProps) {
  const content = invitation.destinations;

  const slice = 6;

  // AHORA hasta 6
  const visibleCards = content.cards.slice(0, slice);
  const total = visibleCards.slice(0, slice).length;

  const primary = invitation.generals.colors.primary ?? "#FFF";
  const secondary = invitation.generals.colors.secondary ?? "#FFF";
  const accent = invitation.generals.colors.accent ?? "#FFF";

  const [frontCard, setFrontCard] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const { containerRef, textRef, fontSize } = useFitText({ min: 10, max: 220 });

  // Orden visual (índices del arreglo visible)
  const [order, setOrder] = useState<number[]>(
    () => visibleCards.map((_, i) => i) // ej [0,1,2,...,5]
  );

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
        }; // return "Comidas";

      default:
        break;
    }
  };

  const bringToFront = (idx: number) => {
    if (total <= 1) return;
    setOrder((prev) => [idx, ...prev.filter((x) => x !== idx)]);
    setFrontCard(idx);
    setFlipped(false);
  };

  // arriba del return
  const PERSPECTIVE = 900; // efecto 3D sutil
  const BASE_GAP = 36; // separación lateral
  const MAX_ROT = 7; // grados totales (izq - der)
  const SCALE_STEP = 0.05; // cuanto disminuye hacia los lados
  const DY_STEP = 4; // caída vertical hacia atrás

  const getPos = (rank: number, total: number) => {
    if (total <= 1) return { dx: 0, dy: 0, rot: 0, scale: 1, z: 10, shadow: 1 };

    const center = (total - 1) / 2;
    const offset = rank - center; // negativo a la izq, positivo a la der
    const dist = Math.abs(offset);

    const dx = offset * BASE_GAP;
    const rot = (offset / center) * MAX_ROT; // -MAX_ROT … +MAX_ROT
    const scale = 1 - dist * SCALE_STEP; // más chica a los lados
    const dy = dist * DY_STEP; // baja un poquito hacia atrás
    const z = total - rank + 5; // asegura pila correcta
    const shadow = 1 - dist * 0.18; // menos sombra al fondo (0..1)

    return { dx, dy, rot, scale, z, shadow };
  };

  useEffect(() => {
    console.log('inv id: ', invitationID)
  }, [invitationID])
  

  return (
    <div
      className="fan_container"
      style={{
        position: "relative",
        maxWidth: "100vw",
        height: "340px",
        minWidth: "100vw",
        padding: "24px",
        boxSizing: "border-box",
        // border: "1px solid",
        perspective: `${PERSPECTIVE}px`,
      }}
    >


      {visibleCards.map((card, i) => {
        const rank = order.indexOf(i);
        const { dx, dy, rot, scale, z, shadow } = getPos(rank, total);
        const elev = i === frontCard ? 1 : shadow; // al frente, más fuerte

        return (
          <FadeLeft key={i} zIndex={z} duration={i} start={-10 - (i * 2)} end={180 + (-28 * i)}>
            <div
              key={i}
              className={styles[card.type]}
              onClick={(e) => {
                e.stopPropagation();
                i == frontCard ? setFlipped((prev) => !prev) : bringToFront(i);
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
                // filter: `drop-shadow(4px 8px ${12 * elev}px rgba(0,0,0,${0.1 + 0.1 * (elev * 2)}))`,
              }}
            >
              <div className={`${styles.flip_card} ${i === frontCard && flipped ? styles.flipped : ""}`}>
                <div className={styles.flip_inner}>
                  <div className={styles.flip_front}>
                    <div
                      className={styles.main_dest_card}
                      style={{
                        // backgroundColor: "#FFF",
                        backgroundColor: lighter(primary, 0.9) ?? "#FFF",
                      }}
                    >
                      <div className={styles.image_dest_cont}>
                        <img
                          src={card.image!}
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

                        {invitationID !== "80d0c716-86e4-4c90-9e6d-9133d970d769" && frontCard === i && (
                          <Button
                            icon={<MdOpenInFull />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlipped((prev) => !prev);
                            }}
                            style={{
                              zIndex: 5,
                              fontSize: "12px",
                              fontWeight: 800,
                              // backgroundColor: `${lighter(primary, 0.9)}40` ?? "#FFF",
                              backdropFilter: "blur(4px)",
                              boxShadow: "0px 0px 8px rgba(0,0,0,0.35)",
                              color: `#000`,
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              height: "40px",
                              width: "40px",
                              transform: "translate(-50%,-50%)",
                            }}
                          />
                        )}

                        {
                          invitationID !== "80d0c716-86e4-4c90-9e6d-9133d970d769" &&
                          <div className={styles.tag_label_container}>
                            <span className={styles.card_label_class}>{translateType(card.type)?.label}</span>
                            <span className={styles.card_icon_class}>{translateType(card.type)?.icon}</span>
                          </div>
                        }
                      </div>

                      {invitation.generals.texture !== null && (
                        <div className={styles.card_texture}>
                          <Image src={"/assets/textures/magzne.jpg"} alt="" fill style={{ objectFit: "cover", opacity: 0.6 }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={styles.flip_back}
                    onClick={(e) => {
                      e.stopPropagation();
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
                        <span className={styles.reversed_card_text} style={{ whiteSpace: "pre-line" }}>
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
                          <Image src={"/assets/textures/magzne.jpg"} alt="" fill style={{ objectFit: "cover", opacity: 1 }} />
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
