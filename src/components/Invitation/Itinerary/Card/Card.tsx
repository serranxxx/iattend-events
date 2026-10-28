import React, { useState } from "react";
import { useIsLargeScreen, useIsTabletPortrait } from "../../layout/InvitationLayout";
import { Button, Drawer } from "antd";
import Image from "next/image";
import { BadgeHelp as LuBadgeHelp } from 'lucide-react';
import { InvitationUIBundle, ItineraryItem, NewInvitation } from "@/types/new_invitation";
import { EditableText } from "../../EditableText";
import { ArrowLeft } from "lucide-react";
import { useEditableList } from "../../useEditableList";
import { getItineraryIcon, isGlyphIcon, isImageIcon } from "@/helpers/icons";
import { MomentGlyph } from "../MomentGlyph";
import { buttonsColorText, lighter } from "@/helpers/functions";
import OpenCard from "../OpenCard/OpenCard";
import { ArrowUpRight as MdArrowOutward } from 'lucide-react';
import { Navigation as FaDiamondTurnRight } from 'lucide-react';
import FadeSides from "@/components/Motion/FadeSides";
import { ITINERARY_STYLE_IDS, ItineraryStyleId, StyledItinerary } from "../ItineraryStyles";

type CardProps = {
  invitation: NewInvitation;
  dev: boolean;
  ui: InvitationUIBundle;
  // Modo edición: al final de la línea, del lado contrario al último
  // momento, un "+ Momento" que agrega uno nuevo.
  editMode?: boolean;
  onAddMoment?: () => void;
  // Con el modo edición, tocar un momento abre su drawer con todo editable.
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};


export default function Card({ ui, invitation, dev, editMode = false, onAddMoment, onFieldChange, onFieldTool }: CardProps) {
  const content = invitation.itinerary;
  const generals = invitation.generals;
  // Momento abierto en el drawer, por su lugar en la lista (así el drawer
  // muestra siempre los datos al día mientras se edita).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";
  const actions = generals.colors.actions;

  // Misma regla que el layout: ancho ≥ 768px y horizontal (iPad vertical = celular).
  const isLargeScreen = useIsLargeScreen();
  // iPad vertical: el drawer sale de abajo como hoja centrada (máx. 560px).
  const isTabletPortrait = useIsTabletPortrait();

  const steps = invitation.itinerary.object;
  const open: ItineraryItem | null = openIndex !== null ? steps[openIndex] ?? null : null;
  // Momentos en la línea, en modo edición: se eligen (borde) y se arrastran
  // para cambiar el orden.
  // Estilo del catálogo (itinerary.style). "1a" o vacío = el zigzag de abajo.
  const styleId = (ITINERARY_STYLE_IDS as readonly string[]).includes(content.style ?? "") ? (content.style as ItineraryStyleId) : "1a";
  const list = useEditableList<ItineraryItem>({
    items: steps,
    path: "itinerary.object",
    editMode,
    onFieldChange,
    makeNew: () => steps[0],
    // El deslizable (1e) y los arcos (1j) se reordenan de lado.
    axis: styleId === "1e" || styleId === "1j" ? "x" : "y",
    // El drawer solo se abre con "Detalles": tocar la tarjeta la elige y
    // arrastrarla la reordena.
  });

  const removeOpen = () => {
    if (openIndex === null) return;
    setOpenIndex(null);
    onFieldChange?.("itinerary.object", steps.filter((_, i) => i !== openIndex));
  };

  const [activeSteps, setActiveSteps] = useState<ItineraryItem[]>([]);


  const body = {
    font: invitation?.generals.fonts.body?.typeFace,
    weight: invitation?.generals.fonts.body?.weight ?? 500,
    size: invitation?.generals.fonts.body?.size ?? 16,
    opacity: invitation?.generals.fonts.body?.opacity ?? 1,
    color: invitation?.generals.fonts.body?.color ?? accent
  }

  const renderIcon = (icon: number | string | null, size: number) => {
    const color = content.background ? (content.inverted ? primary : accent) : content.inverted ? accent : accent;
    if (isImageIcon(icon)) {
      // Tope de tamaño: la ilustración no crece con la tarjeta (en pantallas
      // anchas se veía enorme).
      return <Image src={icon} alt="" width={100} height={100} style={{ width: "100%", maxWidth: 170, height: "auto", objectFit: "cover", margin: "0 auto" }} />;
    }
    if (isGlyphIcon(icon)) return <MomentGlyph icon={icon} size={size} color={color} />;
    const Icon = icon ? getItineraryIcon(icon) : undefined;
    return Icon ? <Icon size={size} style={{ color }} /> : <LuBadgeHelp size={size} style={{ color }} />;
  };

  const ink = content?.dynamic_background?.active ? (content.inverted ? primary : accent) : accent;
  // Los mismos colores del botón "Detalles" de abajo (1a).
  const surface = content?.dynamic_background?.active ? (content.inverted ? primary : secondary) : secondary;
  // Sobre secondary el texto va en primary; sobre primary, en accent.
  const onSurface = surface === primary ? accent : primary;
  const renderIconColored = (icon: number | string | null, size: number, color: string) => {
    if (isImageIcon(icon)) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={icon} alt="" draggable={false} style={{ width: size * 1.6, height: size * 1.6, objectFit: "contain" }} />;
    }
    if (isGlyphIcon(icon)) return <MomentGlyph icon={icon} size={size} color={color} />;
    const Icon = icon ? getItineraryIcon(icon) : undefined;
    return Icon ? <Icon size={size} style={{ color }} /> : <LuBadgeHelp size={size} style={{ color }} />;
  };
  const iconSlot = (index: number, node: React.ReactNode) => editMode ? (
    <button
      type="button"
      className="edit_icon_btn"
      data-edit-hit
      aria-label="Cambiar ícono"
      style={{ padding: 0, border: "none", background: "none", display: "inline-flex", flex: "none", width: "fit-content", maxWidth: "100%" }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onFieldTool?.(`moment_icon:${index}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "itinerary");
      }}
    >
      {node}
    </button>
  ) : node;
  const addButton = (
    <button type="button" className="edit_glass_btn" data-edit-hit onClick={(e) => { e.stopPropagation(); onAddMoment?.(); }}>
      + Momento
    </button>
  );

  const ROW_HEIGHT = 180; // alto mínimo de cada fila (ajústalo a tu diseño)
  const GAP = 0;

  return (
    <>
      {styleId !== "1a" ? (
        <StyledItinerary
          styleId={styleId}
          items={steps}
          ink={ink}
          surface={surface}
          onSurface={onSurface}
          colors={{ primary, secondary, accent, actions: actions ?? accent }}
          sans={body.font ?? "inherit"}
          serif={generals.fonts.titles?.typeFace ?? body.font ?? "serif"}
          cta={ui?.buttons.details ?? "Ver detalles"}
          editMode={editMode}
          listRef={list.listRef}
          row={(i, style) => list.rowProps(i, style ?? {})}
          showDelete={list.showDelete}
          onDelete={list.remove}
          onOpen={setOpenIndex}
          iconSlot={iconSlot}
          renderIcon={renderIconColored}
          addButton={addButton}
        />
      ) : (
      <div
        ref={list.listRef}
        style={{
          position: "relative",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Línea vertical del centro */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: 3,
            transform: "translateX(-50%)",
            background: content.background ? (content.inverted ? primary : accent) : content.inverted ? accent : accent,
            zIndex: 1,
          }}
        />

        {steps.map((item, index) => {
          const leftSide = index % 2 === 0;

          return (
            <div
              key={index}
              {...list.rowProps(index, {
                position: "relative",
                display: "flex",
                justifyContent: leftSide ? "flex-start" : "flex-end",
                alignItems: "center",
                minHeight: ROW_HEIGHT, // altura fija por fila
                marginBottom: index === steps.length - 1 ? 0 : GAP,
                width: "100%",
              }, { outlineChild: true })}
            >
              {/* Tarjeta del evento */}
              <FadeSides side={leftSide}>
                <div
                  data-edit-card={editMode || undefined}
                  style={{
                    width: isImageIcon(item.icon) ? "74%" : "44%",
                    // Tope: en celular no cambia nada; en pantallas más anchas
                    // (iPad vertical) la ilustración no crece de más.
                    maxWidth: isImageIcon(item.icon) ? 260 : 170,
                    margin: "0 2%",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                  }}
                >
                  {editMode ? (
                    // Tocar el ícono / imagen abre su selector en el editor
                    // (panel "Ícono del momento" de iattend-vite).
                    <button
                      type="button"
                      className="edit_icon_btn"
                      data-edit-hit
                      aria-label="Cambiar ícono"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const r = e.currentTarget.getBoundingClientRect();
                        onFieldTool?.(`moment_icon:${index}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "itinerary");
                      }}
                    >
                      {renderIcon(item.icon, 56)}
                    </button>
                  ) : renderIcon(item.icon, 56)}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      lineHeight: 1.25,
                      gap: 4,
                      boxSizing: "border-box",
                      padding: "0px 6px",
                      fontFamily: body.font,
                      fontSize: "14px",
                      color: content?.dynamic_background?.active ? (content.inverted ? primary : accent) : content.inverted ? accent : accent,
                    }}
                  >
                    <span style={{ opacity: body.opacity, fontWeight: body.weight + 100, fontSize: "16px" }}>{item.name}</span>
                    <span style={{ opacity: body.opacity, fontWeight: body.weight - 100, color: lighter(accent, 0.4) ?? "#000" }}>{item.subtext}</span>
                    <span style={{ opacity: body.opacity, fontWeight: body.weight }}>{item.time}</span>
                    <div style={{ marginTop: 6 }}>
                      <Button
                        // Igual que "Eliminar": tocarlo no elige ni arrastra, abre el drawer.
                        data-edit-row-delete
                        onClick={(e) => { e.stopPropagation(); setOpenIndex(index); }}
                        style={{
                          backgroundColor: content?.dynamic_background?.active ? (content.inverted ? primary : secondary) : secondary,
                          color: content?.dynamic_background?.active ? (content.inverted ? accent : accent) : content.inverted ? primary : accent,
                          boxShadow: generals.texture !== null ? "0 0 6px 0 rgba(0, 0, 0, 0.25)" : undefined,
                        }}
                        // onClick={() => setActiveSteps([...(activeSteps ?? []), item])}
                        icon={<MdArrowOutward />}
                      >
                        {ui?.buttons.details}
                      </Button>
                    </div>
                    {list.showDelete(index) && (
                      <button
                        type="button"
                        className="edit_row_delete"
                        data-edit-row-delete
                        onClick={(e) => { e.stopPropagation(); list.remove(index); }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </FadeSides>

              {/* Punto sobre la línea */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: content?.dynamic_background?.active ? (content.inverted ? primary : accent) : content.inverted ? accent : accent,
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                }}
              />


            </div>
          );
        })}

        {editMode && (
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: steps.length % 2 === 0 ? "flex-start" : "flex-end",
              alignItems: "center",
              minHeight: 96,
              width: "100%",
            }}
          >
            <div style={{ width: "44%", margin: "0 2%", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="edit_glass_btn"
                data-edit-hit
                onClick={(e) => { e.stopPropagation(); onAddMoment?.(); }}
              >
                + Momento
              </button>
            </div>
          </div>
        )}
      </div>
      )}
      <Drawer
        placement={isLargeScreen ? 'left' : 'bottom'}
        onClose={() => setOpenIndex(null)}
        open={open ? true : false}
        classNames={{
          body: "scroll-invitation",
          header: editMode ? "edit_drawer" : undefined,
        }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "6px",
              fontFamily: invitation.generals.fonts.body?.typeFace,
              fontSize: "20px",
              color: content.inverted ? primary : accent,
            }}
          >
            {editMode && openIndex !== null ? (
              <EditableText
                key={openIndex}
                path={`itinerary.object.${openIndex}.name`}
                value={open?.name ?? ""}
                editMode
                onFieldChange={onFieldChange}
                placeholder="Nombre del momento"
                className="edit_drawer_title"
              />
            ) : open?.name}
          </div>
        }
        // En el modo edición ocupa toda la pantalla de la pieza (sin scroll de
        // la página detrás).
        height={editMode ? "100%" : "auto"}
        // A pantalla completa (modo edición) no hay fondo que tocar para
        // cerrarlo: lleva una flecha para regresar.
        closeIcon={editMode ? <span className="edit_drawer_close" aria-label="Regresar"><ArrowLeft size={16} /></span> : false}
        style={{
          maxHeight: editMode || isLargeScreen ? "100vh" : "75vh",
          borderRadius: editMode ? 0 : isLargeScreen ? '0px 32px 32px 0px' : "32px 32px 0px 0px",
          
        }}
        styles={{
          // Hoja centrada en iPad vertical (sin transform: lo usa la animación).
          ...(isTabletPortrait && !isLargeScreen && !editMode ? { wrapper: { left: "max(0px, calc(50% - 280px))", right: "max(0px, calc(50% - 280px))" } } : {}),
          header: {
            backgroundColor: content.inverted ? secondary : primary,
          },
          body: {
            backgroundColor: content.inverted ? secondary : primary,
            paddingTop: "12px",
          },
        }}
        extra={
          open?.address?.url && (
            <Button
              href={open?.address.url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<FaDiamondTurnRight size={14} />}
              style={{
                background: content.inverted ? primary : actions ?? "#FFF",
                color: content.inverted ? accent : buttonsColorText(actions!),
              }}
            >
              {ui?.buttons.directions}
            </Button>
          )
        }
      >
        {open && (
          <OpenCard
            key={openIndex}
            dev={dev}
            invitation={invitation}
            item={open}
            setActiveSteps={setActiveSteps}
            activeSteps={activeSteps}
            editMode={editMode}
            index={openIndex ?? 0}
            onFieldChange={onFieldChange}
            onFieldTool={onFieldTool}
          />
        )}
        {editMode && open && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <button type="button" className="edit_drawer_delete" onClick={removeOpen}>Eliminar momento</button>
          </div>
        )}
      </Drawer>
      {/* {steps.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: index % 2 === 0 ? "flex-start" : "flex-end", // alterna
            width: "80%",
          }}
        >
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', lineHeight:1, gap:'2px'
          }}>
            {renderIcon(item.icon!)}
            <span>{item.name}</span>
            <span>{item.time}</span>
            <Button>Detalles</Button>
          </div>

        </div>
      ))} */}
      {/* <div
            key={index}
            className={styles.step_card_cont}
            style={{
              background: content.background
                ? `${primary}${Number.isFinite(generals.texture) ? "80" : ""}`
                : `${secondary}${Number.isFinite(generals.texture) ? "80" : ""}`,
              height: activeSteps?.includes(item) ? "auto" : undefined,
              // border: Number.isFinite(generals.texture) ? "1px solid red" : "1px solid blue",
              border: `1px solid ${accent}10`,
              boxShadow: Number.isFinite(generals.texture) ? "0 0 8px 0 rgba(0, 0, 0, 0.25)" : undefined,
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              className={styles.card_icon}
              style={{
                backgroundColor: content.background ? secondary : primary,
              }}
            >
              {renderIcon(item.icon!)}
            </div>
            <div
              className={styles.card_info}
              style={{
                fontFamily: generals.fonts.body?.typeFace, textAlign: 'left',
                color: content.background ? accent : content.inverted ? primary : accent
              }}
            >
              <span className={styles.open_title}>
                <b>{item.name}</b>
              </span>
              <span className={styles.open_sub}>{item.time}</span>
              <span className={styles.open_text}>{item.subtext}</span>
            </div>
            {item.moments || item.music || item.address ? (
              <Button
                onClick={() => setActiveSteps([...(activeSteps ?? []), item])}
                className={styles.open_card_button}
                icon={<MdArrowOutward size={18} style={{ color: content.inverted ? primary : accent }} />}
                type="text"
              // style={{
              //   background: content.background ? secondary : content.inverted ? primary : actions ?? "#FFF",
              // }}
              />
            ) : null}

          </div>
          <div style={{
            border: `1px solid ${accent}10`,
            background: content.background
              ? `${primary}`
              : `${accent}`,
          }} className={styles.line_it} /> */}
    </>
  );
}
