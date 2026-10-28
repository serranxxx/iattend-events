"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./wallet.module.css";
import { GiftCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { darker } from "@/helpers/functions";
import { resolveGiftBrand } from "./classifyGiftCard";
import type { GiftBrand } from "@/lib/giftBrands/cache";
import { Button, message } from "antd";
import { EditableText } from "../../EditableText";
import { ArrowUpRight as MdArrowOutward } from 'lucide-react';
import { Copy as FaCopy } from 'lucide-react';
import FadeIn from "@/components/Motion/FadeIn";
import FadeDown from "@/components/Motion/FadeDown";
import { ChevronDown, Layers2, Plus, X } from "lucide-react";

type CardProps = {
  invitation: NewInvitation;
  dev?: boolean;
  ui: InvitationUIBundle;
  /** catálogo `gift_brands`; vacío = las tarjetas se pintan sin logo ni fondo de marca */
  brands?: GiftBrand[];
  // Modo edición: la tarjeta abierta tiene todos sus campos editables, el
  // logo es un selector de marca y debajo de la cartera va "Eliminar tarjeta".
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  // Editor de escritorio (iattend-vite): la tarjeta abierta se edita en una
  // barra arriba de la pieza ("gift_card:N"; "gift_card_close" al cerrarla) y
  // el logo deja de ser selector.
  textBar?: boolean;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

// Selector de empresa de una tarjeta (modo edición). Lista propia dentro de la
// tarjeta, no un Select de antd: el popup portaleado se quedaba fijo al hacer
// scroll y sus clics se perdían entre los handlers de la cartera.
function BrandPicker({ brands, current, label, onPick }: {
  brands: GiftBrand[];
  current: GiftBrand | null;
  label: string;
  onPick: (_brand: GiftBrand) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const groups = (["store", "bank"] as const).map((kind) => ({
    kind,
    title: kind === "store" ? "Tiendas" : "Bancos",
    items: brands.filter((b) => b.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div ref={boxRef} className="edit_brand_picker" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="edit_card_brand" onClick={() => setOpen((o) => !o)}>
        {current?.logoUrl
          ? <img src={current.logoUrl} alt="" style={{ height: 20, objectFit: "contain" }} />
          : <span>{label || "Elegir empresa"}</span>}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="edit_brand_list scroll-invitation">
          {groups.map((g) => (
            <div key={g.kind}>
              <span className="edit_brand_group">{g.title}</span>
              {g.items.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="edit_brand_item"
                  data-on={current?.id === b.id || undefined}
                  onClick={() => { onPick(b); setOpen(false); }}
                >
                  <span className="edit_brand_chip" style={{ background: b.background ?? "#F4F3F0" }}>
                    {b.logoUrl ? <img src={b.logoUrl} alt="" /> : <span style={{ color: b.textColor ?? "#29262D" }}>{b.name.slice(0, 2)}</span>}
                  </span>
                  {b.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Wallet({ ui, invitation, dev: _dev = false, brands = [], editMode = false, onFieldChange, textBar = false, onFieldTool }: CardProps) {
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


  const ANIM_MS = 250; // duración de cada fase (match con CSS)
  const SCALE_UP = 1.2; // escala al abrir
  const DOWN_PX = 50; // “bajar” después de subir

  const [movedIndex, setMovedIndex] = useState<number | null>(null);

  // En modo edición, con 2 o menos tarjetas, va una más hasta adelante:
  // "Agregar tarjeta". Ocupa el primer lugar del montón, así que las tarjetas
  // reales se corren un lugar (`slot`).
  const cardCount = invitation?.gifts?.cards?.length ?? 0;
  const showAddCard = editMode && cardCount < 3;
  const slotOffset = showAddCard ? 1 : 0;
  const slot = (index: number) => index + slotOffset;
  const [isScaled, setIsScaled] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);

  const FAN_OFFSET = 150;
  const FAN_ANGLES: Record<number, number[]> = { 1: [0], 2: [-12, -26], 3: [-10, -22, -36] };

  const getFanAngle = (index: number, total: number) =>
    FAN_ANGLES[total]?.[index] ?? 0;

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
      next[slot(index)] = jump; // sube
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
    clearAllTimeouts();
    setFanOpen(false);
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

  const toggleFan = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (animatingRef.current) return;
    if (movedIndex !== null) {
      handleReset();
      schedule(() => setFanOpen(true), ANIM_MS + 10);
    } else {
      setFanOpen(f => !f);
    }
  };

  // ── Abanico en modo edición: es para reordenar ──
  // Tocar una tarjeta abierta en abanico no la abre: se arrastra y, al
  // soltarla sobre otra, toma su lugar en la lista.
  const [fanDrag, setFanDrag] = useState<{ index: number; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const onFanMove = (e: React.PointerEvent) => {
    if (!fanDrag) return;
    const dx = e.clientX - fanDrag.x;
    const dy = e.clientY - fanDrag.y;
    setFanDrag({ ...fanDrag, dx, dy, moved: fanDrag.moved || Math.hypot(dx, dy) > 6 });
  };
  const onFanUp = (e: React.PointerEvent) => {
    const drag = fanDrag;
    setFanDrag(null);
    if (!drag?.moved) return;
    // La tarjeta (otra) cuyo centro quedó más cerca del puntero.
    const others = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-wallet-card]") ?? [])
      .map((el) => ({ i: Number(el.dataset.walletCard), r: el.getBoundingClientRect() }))
      .filter((c) => c.i !== drag.index);
    let to = drag.index;
    let best = Infinity;
    for (const c of others) {
      const d = Math.hypot(e.clientX - (c.r.left + c.r.width / 2), e.clientY - (c.r.top + c.r.height / 2));
      if (d < best) { best = d; to = c.i; }
    }
    if (to === drag.index) return;
    const next = [...invitation.gifts.cards];
    const [moved] = next.splice(drag.index, 1);
    next.splice(to, 0, moved);
    onFieldChange?.("gifts.cards", next);
  };

  const handleCardPointerDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    if (editMode && fanOpen && movedIndex === null) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setFanDrag({ index, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false });
      return;
    }
    if (fanOpen) {
      setFanOpen(false);
      schedule(() => handleClick(index), 150);
      return;
    }
    handleClick(index);
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
  // Solo cuando cambia CUÁNTAS tarjetas hay: si dependiera de toda la
  // invitación, cada letra escrita en el modo edición recolocaba las tarjetas
  // y la abierta se iba y regresaba.
  useEffect(() => {
    if (invitation) {
      const sliced = invitation.gifts.cards.slice(0, 3);
      switch (sliced.length + (showAddCard ? 1 : 0)) {
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
  }, [cardCount, showAddCard]);

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

  // ── Modo edición ──
  // Escritorio: avisa al editor qué tarjeta quedó abierta (su barra).
  const barOpen = useRef(false);
  useEffect(() => {
    if (!editMode || !textBar) return;
    const r = ref.current?.getBoundingClientRect();
    const rect = { x: r?.left ?? 0, y: r?.top ?? 0, w: r?.width ?? 0, h: r?.height ?? 0 };
    if (movedIndex !== null) {
      barOpen.current = true;
      onFieldTool?.(`gift_card:${movedIndex}`, rect, "gifts");
    } else if (barOpen.current) {
      barOpen.current = false;
      onFieldTool?.("gift_card_close", rect, "gifts");
    }
  }, [movedIndex, editMode, textBar]);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const setCard = (index: number, patch: Partial<GiftCard>) =>
    onFieldChange?.(`gifts.cards.${index}`, { ...invitation.gifts.cards[index], ...patch });
  const pickBrand = (index: number, b: GiftBrand) => {
    setCard(index, b.kind === "store" ? { kind: "store", brand: b.name } : { kind: "bank", bank: b.name });
  };
  // La tarjeta recién agregada se abre sola (cuando ya se recolocó el montón).
  const openAfterAdd = useRef<number | null>(null);
  useEffect(() => {
    const index = openAfterAdd.current;
    if (index === null || index >= cardCount) return;
    openAfterAdd.current = null;
    schedule(() => handleClick(index), 60);
  }, [cardCount]);
  // La nueva va hasta adelante del montón (primera de la lista).
  const addCard = () => {
    openAfterAdd.current = 0;
    onFieldChange?.("gifts.cards", [
      { kind: "store", brand: null, url: null, bank: null, name: null, number: null },
      ...invitation.gifts.cards,
    ]);
  };
  const removeOpenCard = () => {
    if (movedIndex === null) return;
    const index = movedIndex;
    handleReset();
    onFieldChange?.("gifts.cards", invitation.gifts.cards.filter((_, i) => i !== index));
  };

  return (
    <>
      {contextHolder}
      <FadeIn>
        <div
          ref={ref}
          // En modo edición la zona del módulo apaga los toques de sus hijos:
          // la cartera los recupera para abrir tarjetas y editarlas.
          data-edit-hit={editMode || undefined}
          className={invitation.generals.texture !== null ? styles.wallet : styles.wallet_light}
          style={{
            backgroundColor:
              darker(content?.dynamic_background?.active ? (content.inverted ? primary : secondary) : content.inverted ? secondary : primary, 0.95) ??
              "#FFF",
            // Mismo tamaño que en celular también en pantallas grandes (la
            // escala de 0.9 la hacía bastante más grande que en el teléfono).
            transform: "scale(0.7)",
            // Sin la imagen de papel de .wallet: la cartera va limpia, sin textura.
            backgroundImage: "none",
            marginTop: '-24px',
            marginBottom:'-44px'
          }}
        >
          {bottoms.length > 0 &&
            cards?.map((card, index) => {
              const marca = resolveGiftBrand(card, brands);

              return (
              <FadeDown
                // En edición la key no lleva la marca: cambiar de empresa
                // remontaba la tarjeta y repetía su animación de entrada.
                key={editMode ? index : `${marca.key}-${index}`}
                duration={index}
                zIndex={movedIndex === index || fanDrag?.index === index ? 12 : cards.length + 5 - index}
              >
                <div
                  className={styles.card}
                  style={{
                    // Fondo y color de texto vienen del catálogo: antes eran una
                    // clase CSS por marca en wallet.module.css, lo que hacía
                    // imposible dar de alta una marca nueva sin tocar el repo.
                    // Tarjeta nueva sin empresa (modo edición): blanca.
                    background: marca.background ?? (editMode ? "#FFFFFF" : undefined),
                    color: marca.textColor ?? (editMode && !marca.background ? "#29262D" : undefined),
                    zIndex: movedIndex === index || fanDrag?.index === index ? 12 : cards.length + 5 - index,
                    bottom: fanOpen && movedIndex === null ? `${(baseRef.current[slot(index)] ?? 0) + FAN_OFFSET}px` : `${bottoms[slot(index)]}px`,
                    padding: movedIndex === index ? "24px" : undefined,
                    border: `1px solid ${accent}10`,
                    transition: fanDrag?.index === index ? "none" : "bottom 250ms ease, transform 250ms ease",
                    transform:
                      fanDrag?.index === index
                        ? `translate(${fanDrag.dx}px, ${fanDrag.dy}px) rotate(${getFanAngle(index, cards.length)}deg)`
                        : fanOpen && movedIndex === null
                        ? `rotate(${getFanAngle(index, cards.length)}deg)`
                        : movedIndex === index
                          ? isScaled
                            ? `scale(${SCALE_UP}) translateY(${DOWN_PX}px)`
                            : "scale(1) translateY(0)"
                          : "scale(1) translateY(0)",
                    transformOrigin: "bottom center",
                    touchAction: "manipulation",
                  }}
                  onPointerDown={(e) => handleCardPointerDown(e, index)}
                  onPointerMove={editMode ? onFanMove : undefined}
                  onPointerUp={editMode ? onFanUp : undefined}
                  onPointerCancel={editMode ? () => setFanDrag(null) : undefined}
                  data-wallet-card={index}
                  data-edit-card-open={editMode && (movedIndex === index || fanDrag?.index === index) ? true : undefined}
                >
                  {/* Abierta en modo edición: "×" arriba a la derecha para eliminarla. */}
                  {editMode && movedIndex === index && (
                    <button
                      type="button"
                      className="edit_card_remove"
                      aria-label="Eliminar tarjeta"
                      onPointerDown={stop}
                      onClick={(e) => { e.stopPropagation(); removeOpenCard(); }}
                    >
                      <X size={14} strokeWidth={2.6} />
                    </button>
                  )}
                  <div
                    className={styles.card_logo_container}
                    style={{
                      height: movedIndex === index ? "24px" : undefined,
                    }}
                  >
                    {editMode && movedIndex === index && !textBar ? (
                      // El logo es el selector de la empresa (catálogo gift_brands).
                      <BrandPicker
                        brands={brands}
                        current={marca.brand}
                        label={(card.kind === "store" ? card.brand : card.bank) ?? ""}
                        onPick={(b) => pickBrand(index, b)}
                      />
                    ) : marca.logoUrl ? (
                      <img src={marca.logoUrl} alt="" style={{ height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span>{(card.kind === "store" ? card.brand : card.bank) || (editMode ? "Nueva tarjeta" : "")}</span>
                    )}
                  </div>

                  {editMode && movedIndex === index ? (
                    // Campos de la tarjeta abierta, escritos encima.
                    <div className={`${styles.wallet_col} edit_drawer`} style={{ gap: "12px" }} onPointerDown={stop} onClick={stop}>
                      {card.kind === "store" ? (
                        <EditableText path={`gifts.cards.${index}.url`} value={card.url ?? ""} editMode onFieldChange={onFieldChange} placeholder="Link de la mesa de regalos" style={{ wordBreak: "break-all", fontSize: 13 }} />
                      ) : (
                        <>
                          <EditableText path={`gifts.cards.${index}.name`} value={card.name ?? ""} editMode onFieldChange={onFieldChange} placeholder="Nombre del titular" />
                          <EditableText path={`gifts.cards.${index}.number`} value={card.number ?? ""} editMode onFieldChange={onFieldChange} placeholder="Número de cuenta o CLABE" />
                        </>
                      )}
                    </div>
                  ) : card.kind === "store" ? (
                    <div className={styles.wallet_col} style={{ gap: "6px" }}>
                      <span>{ui.labels.DiscoverGifts}</span>
                      <Button
                        onPointerDown={(e) => e.stopPropagation()}
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
                          onPointerDown={(e) => e.stopPropagation()}
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
              );
            })}

          {/* "Agregar tarjeta" (modo edición, 2 o menos): la última del
              montón, asoma por arriba como las demás. */}
          {showAddCard && bottoms.length > (cards?.length ?? 0) && (
            <div
              className={`${styles.card} edit_add_card`}
              style={{ bottom: `${bottoms[0]}px`, zIndex: (cards?.length ?? 0) + 6 }}
              onPointerDown={stop}
              onClick={(e) => { e.stopPropagation(); addCard(); }}
            >
              <span className="edit_add_card_label"><Plus size={15} strokeWidth={2.4} /> Agregar tarjeta</span>
            </div>
          )}

          {/* Bolsillo: se pinta ENCIMA de las tarjetas (z-index 10) a propósito, para el
              efecto de "tarjetas dentro de la cartera". No hacerlo pointer-events: none:
              debajo quedan los CTA ocultos de las tarjetas cerradas y se volverían
              tappeables sin ser visibles. */}
          <div
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            style={{
              backgroundColor:
                darker(content?.dynamic_background?.active ? (content.inverted ? primary : secondary) : content.inverted ? secondary : primary, 0.95) ??
                "#FFF",
              borderColor: content.inverted ? `${accent}60` : `${primary}60`,
              backgroundImage: "none", // sin textura (ver arriba)
              justifyContent: "space-between",
              zIndex:10
            }}
            className={`${invitation.generals.texture !== null ? styles.department : styles.department_light} ${styles.one}`}
          >
            <div className={styles.wallet_col} style={{ fontFamily: fontFamily }}>
              <span
                style={{ color: content?.dynamic_background?.active ? (content.inverted ? accent : primary) : content.inverted ? primary : accent }}
                className={styles.wallet_label}
              >
                {title}
              </span>
              <span
                style={{ color: content?.dynamic_background?.active ? (content.inverted ? accent : primary) : content.inverted ? primary : accent }}
                className={styles.wallet_sec_label}
              >
                {ui.labels.cards}
              </span>
            </div>

            {(cards?.length ?? 0) > 1 && (
              <Button
                shape="circle"
                // size="small"
                onClick={toggleFan}
                icon={fanOpen
                  ? <X size={12} style={{ color: content.inverted ? primary : accent }} />
                  : <Layers2  size={16} style={{ color: content.inverted ? primary : accent }} />
                }
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${content.inverted ? `${primary}40` : `${accent}40`}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            )}
          </div>
        </div>
      </FadeIn>
    </>
  );
}
