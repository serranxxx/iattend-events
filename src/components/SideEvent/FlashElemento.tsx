"use client";

import React from "react";
import { Heart } from "lucide-react";
import type { Generals } from "@/types/new_invitation";
import type { FlashSticker } from "@/types/side_event";
import { Separador } from "../Invitation/Separator/Separator";
import { iconsItinerary } from "@/helpers/icons";
import { LAYER_ICONS } from "../Invitation/SectionLayer/SectionLayer";
import Vector from "../Vector/Vector";
import styles from "./flash-elemento.module.css";

// Elemento de la portada de un Flash que no es imagen (`body.stickers[n].kind`):
// ícono, forma, texto, línea o decoración. Mismo modelo y mismo dibujo que los
// elementos de la invitación (SectionLayer). Contraparte en el editor:
// iattend-vite/src/modules/SideEvents/FlashElemento.jsx. El lienzo de los PNG
// (.stickers_lienzo) es `container-type: inline-size`: los textos miden en cqw
// y escalan igual que una imagen. Sin color propio va en blanco.

const DEFAULT_COLOR = "#FFFFFF";
const TEXT_FACTOR: Record<string, number> = { title: 0.16, subtitle: 0.1, body: 0.06 };
const LINE_BORDER: Record<string, string> = {
  solid: "1.5px solid",
  dashed: "1.5px dashed",
  dotted: "3px dotted",
  double: "4px double",
};
const BOX_SHAPES = new Set(["square", "rect"]);
const NS = { vectorEffect: "non-scaling-stroke" as const };
const SHAPE_PATHS: Record<string, React.ReactNode> = {
  circle: <ellipse cx="50" cy="50" rx="50" ry="50" {...NS} />,
  triangle: <polygon points="50,0 100,100 0,100" {...NS} />,
  star: <polygon points="50,2 61,37 98,37 68,59 79,96 50,73 21,96 32,59 2,37 39,37" {...NS} />,
};
const dashFor = (style: string | null | undefined, sw: number) =>
  style === "dashed" ? `${sw * 3} ${sw * 2}` : style === "dotted" ? `0 ${sw * 2}` : undefined;

export default function FlashElemento({ s, titleFont, bodyFont = "Poppins" }: { s: FlashSticker; titleFont?: string; bodyFont?: string }) {
  const color = s.color && s.color !== "transparent" ? s.color : DEFAULT_COLOR;

  if (s.kind === "icon") {
    if (s.src && s.vector) return <Vector s={s} color={color} />;
    if (s.src) {
      return s.tint === false
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={s.src} alt="" draggable={false} className={styles.icon} />
        : <span className={`${styles.icon} ${styles.maskIcon}`} style={{ backgroundColor: color, WebkitMaskImage: `url("${s.src}")`, maskImage: `url("${s.src}")` }} />;
    }
    if (s.icon?.startsWith("it:")) {
      const ItIcon = iconsItinerary.find((x) => x.index === Number(s.icon?.slice(3)))?.value;
      if (ItIcon) return <ItIcon className={styles.icon} color={color} />;
    }
    const Icon = LAYER_ICONS[s.icon ?? ""] ?? Heart;
    return <Icon className={styles.icon} color={color} strokeWidth={1.6} />;
  }

  if (s.kind === "shape") {
    const sw = s.strokeWidth ?? 0;
    const fill = s.color === "transparent" ? "transparent" : s.color || DEFAULT_COLOR;
    const stroke = s.stroke || DEFAULT_COLOR;
    if (BOX_SHAPES.has(s.variant ?? "square")) {
      const r = s.radius ?? 0;
      return (
        <span
          className={styles.shapeBox}
          style={{
            aspectRatio: `1 / ${s.ar ?? 1}`,
            background: fill,
            border: sw > 0 ? `${sw}px ${s.strokeStyle || "solid"} ${stroke}` : "none",
            borderRadius: r >= 999 ? 9999 : `${(r / 390) * 100}cqw`,
          }}
        />
      );
    }
    return (
      <span className={styles.shape} style={{ aspectRatio: `1 / ${s.ar ?? 1}` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
          <g fill={fill === "transparent" ? "none" : fill} stroke={sw > 0 ? stroke : "none"} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dashFor(s.strokeStyle, sw)}>
            {SHAPE_PATHS[s.variant ?? "circle"] ?? SHAPE_PATHS.circle}
          </g>
        </svg>
      </span>
    );
  }

  if (s.kind === "separator") {
    return (
      <span className={styles.separator}>
        <Separador value={Number(s.variant) || 1} generals={{ colors: { accent: color } } as unknown as Generals} />
      </span>
    );
  }

  if (s.kind === "line") {
    return <span className={styles.line} style={{ borderTop: `${LINE_BORDER[s.variant ?? "solid"] ?? LINE_BORDER.solid} ${color}` }} />;
  }

  const variant = s.variant ?? "body";
  return (
    <span
      className={styles.text}
      style={{
        color,
        fontFamily: s.font || (variant === "title" ? titleFont : bodyFont),
        fontWeight: variant === "title" ? 600 : variant === "subtitle" ? 500 : 400,
        fontSize: `${s.w * (TEXT_FACTOR[variant] ?? 0.06)}cqw`,
      }}
    >
      {s.text}
    </span>
  );
}
