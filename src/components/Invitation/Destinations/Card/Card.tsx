import { useEffect, useRef, useState } from "react";
import { DestinationCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { Drawer } from "antd";
import { ArrowLeft, ImagePlus, Plus } from "lucide-react";
import { EditableText } from "../../EditableText";
import styles from "./card.module.css";
import { Button } from "antd";
import Image from "next/image";
import { lighter } from "@/helpers/functions";
import { Utensils as ImSpoonKnife } from 'lucide-react';
import { Hotel as FaHotel } from 'lucide-react';
import { ArrowUpRight as MdArrowOutward, Maximize2 as MdOpenInFull, Compass as MdSportsGymnastics } from 'lucide-react';
import FadeLeft from "@/components/Motion/FadeLeft";

type CardProps = {
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  invitationID: string | undefined;
  // Modo edición: tocar la tarjeta de enfrente abre un drawer con todo
  // editable, y al frente va "Agregar actividad" mientras haya lugar.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

// Solo se ven las primeras 6 (el panel avisa lo mismo).
const MAX_CARDS = 6;
const TYPES: { value: DestinationCard["type"]; label: string }[] = [
  { value: "hotel", label: "Hospedaje" },
  { value: "activitie", label: "Actividad" },
  { value: "food", label: "Comida" },
];

export default function Card({ ui, invitation, invitationID, editMode = false, onFieldChange, onFieldTool }: CardProps) {
  const content = invitation.destinations;
  const slice = MAX_CARDS;

  // En modo edición, la primera del montón es "Agregar actividad" (null).
  const realCards = content.cards.slice(0, slice);
  const showAdd = editMode && content.cards.length < MAX_CARDS;
  const visibleCards: (DestinationCard | null)[] = showAdd ? [null, ...realCards] : realCards;
  const total = visibleCards.length;
  // Índice en destinations.cards de la tarjeta en la posición `i` del montón.
  const realIndex = (i: number) => (showAdd ? i - 1 : i);

  const primary = invitation.generals.colors.primary ?? "#FFF";
  const accent = invitation.generals.colors.accent ?? "#FFF";

  const [frontCard, setFrontCard] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [autoHeight, setAutoHeight] = useState<boolean>(false);

  const [order, setOrder] = useState<number[]>(() => visibleCards.map((_, i) => i));
  // Si cambia cuántas hay (agregar / borrar en modo edición), el montón se
  // reacomoda en orden.
  useEffect(() => {
    setOrder(visibleCards.map((_, i) => i));
    setFrontCard(0);
  }, [total]);

  // Drawer de edición: índice en destinations.cards.
  const [editing, setEditing] = useState<number | null>(null);
  const editCard = editing !== null ? content.cards[editing] ?? null : null;
  const base = `destinations.cards.${editing}`;
  const addCard = () => {
    onFieldChange?.("destinations.cards", [
      { image: null, name: "Nueva actividad", description: "", url: "", type: "activitie" },
      ...content.cards,
    ]);
    setEditing(0);
  };
  const removeEditing = () => {
    if (editing === null) return;
    const index = editing;
    setEditing(null);
    onFieldChange?.("destinations.cards", content.cards.filter((_, i) => i !== index));
  };
  const openImageTool = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    onFieldTool?.(`dest_image:${editing}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "destinations");
  };

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const movedTouch = useRef<boolean>(false);
  const isAnimating = useRef<boolean>(false);
  const wheelAccumulator = useRef<number>(0);
  const backScrolled = useRef<boolean>(false);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SWIPE_THRESHOLD = 40;
  const WHEEL_THRESHOLD = 60;
  const ANIMATION_TIME = 350;
  const FLIP_DURATION = 360;

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
        return { label: "", icon: null };
    }
  };

  const closeExpanded = () => {
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    setAutoHeight(false);
    setExpanded(false);
    setFlipped(false);
  };

  const resetCardState = () => {
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    setAutoHeight(false);
    setFlipped(false);
    setExpanded(false);
  };

  const bringToFront = (idx: number) => {
    if (total <= 1 || isAnimating.current) return;
    isAnimating.current = true;
    setOrder((prev) => [idx, ...prev.filter((x) => x !== idx)]);
    setFrontCard(idx);
    resetCardState();
    setTimeout(() => { isAnimating.current = false; }, ANIMATION_TIME);
  };

  const rotateForward = () => {
    if (total <= 1 || isAnimating.current) return;
    isAnimating.current = true;
    setOrder((prev) => {
      const next = [...prev.slice(1), prev[0]];
      setFrontCard(next[0]);
      return next;
    });
    resetCardState();
    setTimeout(() => { isAnimating.current = false; }, ANIMATION_TIME);
  };

  const rotateBackward = () => {
    if (total <= 1 || isAnimating.current) return;
    isAnimating.current = true;
    setOrder((prev) => {
      const next = [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)];
      setFrontCard(next[0]);
      return next;
    });
    resetCardState();
    setTimeout(() => { isAnimating.current = false; }, ANIMATION_TIME);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (expanded) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    movedTouch.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (expanded) return;
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;
    if (Math.abs(touchDeltaX.current) > 10) movedTouch.current = true;
  };

  const handleTouchEnd = () => {
    if (expanded) return;
    if (touchStartX.current === null) return;
    if (touchDeltaX.current <= -SWIPE_THRESHOLD) rotateForward();
    else if (touchDeltaX.current >= SWIPE_THRESHOLD) rotateBackward();
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setTimeout(() => { movedTouch.current = false; }, 50);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (total <= 1 || expanded) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccumulator.current += delta;
    if (Math.abs(wheelAccumulator.current) < WHEEL_THRESHOLD) return;
    if (wheelAccumulator.current > 0) rotateForward();
    else rotateBackward();
    wheelAccumulator.current = 0;
  };

  const PERSPECTIVE = 900;
  const BASE_GAP = 36;
  const MAX_ROT = 7;
  const SCALE_STEP = 0.05;
  const DY_STEP = 4;

  const getPos = (rank: number, totalCards: number) => {
    if (totalCards <= 1) return { dx: 0, dy: 0, rot: 0, scale: 1, z: 10 };
    const center = (totalCards - 1) / 2;
    const offset = rank - center;
    const dist = Math.abs(offset);
    return {
      dx: offset * BASE_GAP,
      rot: center === 0 ? 0 : (offset / center) * MAX_ROT,
      scale: 1 - dist * SCALE_STEP,
      dy: dist * DY_STEP,
      z: totalCards - rank + 5,
    };
  };

  return (
    <>
      {expanded && (
        <div
          onClick={closeExpanded}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}
      <div
        className="fan_container scroll-invitation"
        data-edit-hit={editMode || undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={expanded ? closeExpanded : undefined}
        style={{
          position: "relative",
          maxWidth: "100vw",
          minWidth: "100vw",
          height: "340px",
          padding: "24px",
          boxSizing: "border-box",
          perspective: `${PERSPECTIVE}px`,
          touchAction: expanded ? "none" : "pan-x pan-y",
          overflow: expanded ? "visible" : "hidden",
          zIndex: expanded ? 9999 : 99,
        }}
      >
        {visibleCards.map((card, i) => {
          const rank = order.indexOf(i) < 0 ? i : order.indexOf(i);
          const { dx, dy, rot, scale, z } = getPos(rank, total);
          const isExpandedCard = i === frontCard && expanded;
          const isAutoCard = isExpandedCard && autoHeight;

          return (
            <FadeLeft
              key={i}
              zIndex={isExpandedCard ? 9999 : z}
              duration={i}
              start={-10 - i * 2}
              end={180 + -28 * i}
            >
              {card === null ? (
                // "Agregar actividad" (modo edición): blanca, al frente.
                <div
                  className={`${styles.activitie} edit_dest_add`}
                  data-edit-hit
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAnimating.current) return;
                    if (i !== frontCard) { bringToFront(i); return; }
                    addCard();
                  }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "53%",
                    transform: `translate(-50%, 50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
                    zIndex: z,
                    transition: "transform .4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  <span className="edit_add_card_label"><Plus size={16} strokeWidth={2.4} /> Agregar actividad</span>
                </div>
              ) : (
              <div
                className={`${styles[card.type]}${editMode ? " edit_hover_card" : ""}`}
                data-edit-hit={editMode || undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (expanded) return;
                  if (movedTouch.current || isAnimating.current) return;
                  // Modo edición: la de enfrente se abre para editarla.
                  if (editMode && i === frontCard) { setEditing(realIndex(i)); return; }
                  bringToFront(i);
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "53%",
                  transform: isExpandedCard
                    ? `translate(-50%, 50%) scale(1.2)`
                    : `translate(-50%, 50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
                  transformOrigin: "center",
                  zIndex: isExpandedCard ? 9999 : z,
                  transition: "transform .4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity .3s ease",
                  cursor: expanded ? "default" : total > 1 ? "pointer" : "default",
                  opacity: expanded && !isExpandedCard ? 0 : 1,
                  pointerEvents: expanded && !isExpandedCard ? "none" : "auto",
                  ...(isAutoCard ? { height: "auto" } : {}),
                }}
              >
                <div
                  className={`${styles.flip_card} ${i === frontCard && flipped && !isAutoCard ? styles.flipped : ""}`}
                  style={isAutoCard ? { height: "auto" } : {}}
                >
                  <div
                    className={styles.flip_inner}
                    style={isAutoCard ? { height: "auto", transform: "none", transition: "none" } : {}}
                  >
                    <div
                      className={styles.flip_front}
                      style={isAutoCard ? { display: "none" } : {}}
                    >
                      <div
                        className={styles.main_dest_card}
                        style={{ backgroundColor: lighter(primary, 0.9) ?? "#FFF" }}
                      >
                        <div className={styles.image_dest_cont}>
                          <img
                            src={card.image!}
                            alt={card.name ?? ""}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />

                          <div className={styles.dest_text_box}>
                            <span
                              className={styles.dest_label}
                              style={{ color: lighter(primary, 0.9) ?? "#FFF" }}
                            >
                              {card.name}
                            </span>
                          </div>

                          {!editMode && invitationID !== "80d0c716-86e4-4c90-9e6d-9133d970d769" && frontCard === i && (
                            <Button
                              icon={<MdOpenInFull />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAnimating.current) return;
                                setExpanded(true);
                                setFlipped(true);
                                expandTimerRef.current = setTimeout(() => setAutoHeight(true), FLIP_DURATION);
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
                      </div>
                    </div>

                    <div
                      className={styles.flip_back}
                      style={isAutoCard
                        ? { position: "relative", height: "auto", transform: "none", overflow: "hidden" }
                        : isExpandedCard ? { touchAction: "pan-y" } : {}
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAnimating.current) return;
                        if (backScrolled.current) { backScrolled.current = false; return; }
                        closeExpanded();
                      }}
                      onTouchStart={isExpandedCard ? (e) => { e.stopPropagation(); backScrolled.current = false; } : undefined}
                      onTouchMove={isExpandedCard ? (e) => { e.stopPropagation(); backScrolled.current = true; } : undefined}
                      onTouchEnd={isExpandedCard ? (e) => e.stopPropagation() : undefined}
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
                          ...(isAutoCard ? { height: "auto" } : {}),
                        }}
                      >
                        <div
                          className="scroll-invitation"
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "flex-start",
                            flexDirection: "column",
                            gap: "6px",
                            color: accent,
                            flex: 1,
                            minHeight: 0,
                            overflowX: "hidden",
                            overflowY: "hidden",
                            paddingBottom: "6px",
                            width: "100%",
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
                            flexShrink: 0,
                          }}
                        >
                          Navegar
                        </Button>

                        {invitation.generals.texture !== null && (
                          <div className={styles.card_texture}>
                            <Image
                              src={"/assets/textures/magazine.jpg"}
                              alt=""
                              fill
                              style={{ objectFit: "cover", opacity: 1 }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </FadeLeft>
          );
        })}
      </div>

      {/* Drawer de edición de una actividad (modo edición), a pantalla
          completa como el de los momentos. */}
      {editMode && (
        <Drawer
          placement="bottom"
          open={editCard !== null}
          onClose={() => setEditing(null)}
          height="100%"
          closeIcon={<span className="edit_drawer_close" aria-label="Regresar"><ArrowLeft size={16} /></span>}
          classNames={{ body: "scroll-invitation", header: "edit_drawer" }}
          styles={{
            header: { backgroundColor: primary },
            body: { backgroundColor: primary, paddingTop: 12 },
          }}
          title={editCard && (
            <EditableText
              key={editing}
              path={`${base}.name`}
              value={editCard.name ?? ""}
              editMode
              onFieldChange={onFieldChange}
              placeholder="Nombre"
              className="edit_drawer_title"
              style={{ fontFamily: invitation.generals.fonts.body?.typeFace, fontSize: 20, color: accent }}
            />
          )}
        >
          {editCard && (
            <div key={editing} className="edit_drawer" style={{ display: "flex", flexDirection: "column", gap: 20, color: accent, fontFamily: invitation.generals.fonts.body?.typeFace }}>
              {editCard.image ? (
                <div style={{ position: "relative", width: "100%", height: 220, borderRadius: 16, overflow: "hidden" }}>
                  <img src={editCard.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" className="edit_center_btn edit_center_btn--always" onClick={openImageTool}>
                    <ImagePlus size={14} /> Cambiar imagen
                  </button>
                </div>
              ) : (
                <button type="button" className="edit_drawer_image_empty" onClick={openImageTool} style={{ color: accent }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Imagen</span>
                </button>
              )}

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Tipo</span>
                <div className="edit_type_pills">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="edit_type_pill"
                      data-on={editCard.type === t.value || undefined}
                      onClick={() => onFieldChange?.(`${base}.type`, t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Información</span>
                <EditableText path={`${base}.description`} value={editCard.description ?? ""} editMode onFieldChange={onFieldChange} multiline placeholder="Descripción" />
              </div>

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Link</span>
                <EditableText path={`${base}.url`} value={editCard.url ?? ""} editMode onFieldChange={onFieldChange} placeholder="Google Maps, sitio web…" style={{ wordBreak: "break-all" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                <button type="button" className="edit_drawer_delete" onClick={removeEditing}>Eliminar actividad</button>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
