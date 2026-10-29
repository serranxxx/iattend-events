"use client";

import React from "react";
import { LAYER_ICONS } from "../SectionLayer/SectionLayer";
import { esUrlDeVector, estiloVector, useVector } from "@/helpers/vector";
import { SEPARADOR_COLOR } from "@/helpers/icons";

// Ícono de un momento elegido desde Elementos del editor (iattend-vite):
// "lucide:<Nombre>" (los mismos íconos de los elementos sueltos),
// "shape:<forma>" (contorno) o "svg:<url>" (SVG del catálogo). Del color del
// momento.
const SHAPES: Record<string, React.ReactNode> = {
  square: <rect x="6" y="6" width="88" height="88" />,
  rect: <rect x="4" y="22" width="92" height="56" />,
  circle: <circle cx="50" cy="50" r="44" />,
  triangle: <polygon points="50,6 94,92 6,92" />,
  star: <polygon points="50,6 61,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 39,38" />,
};

// Vector del catálogo como ícono: en línea, del color del momento y con el
// trazo de un ícono (fijo, no el del archivo, que a este tamaño no se ve).
function VectorGlyph({ url, size, color, trazo }: { url: string; size: number; color: string; trazo: number }) {
  const info = useVector(url);
  if (!info) return <MaskGlyph url={url} size={size} color={color} />;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block", width: size, height: size, flex: "none", color, lineHeight: 0,
        ...estiloVector({ strokeFixed: true, strokePx: trazo }, info),
      } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: info.markup }}
    />
  );
}

function MaskGlyph({ url, size, color }: { url: string; size: number; color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block", width: size, height: size, backgroundColor: color,
        WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
        WebkitMaskSize: "contain", maskSize: "contain",
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
      }}
    />
  );
}

export function MomentGlyph({ icon: valor, size = 24, color: colorEstilo }: { icon: string; size?: number; color: string }) {
  // "<ícono>§<color>§<grosor>": el momento trae color y/o grosor propios
  // (conColorDeIcono). Íconos y formas: grosor de un ícono de 24 px (escala
  // con `size`, como Lucide). Vectores: px reales, no escala; un dibujo
  // grande con el trazo escalado se empastaba (a 68 px, 1.6–2 px se ve fino).
  const [icon, colorPropio, grosorPropio] = valor.split(SEPARADOR_COLOR);
  const color = colorPropio || colorEstilo;
  const grosor24 = Number(grosorPropio) > 0 ? Number(grosorPropio) : 1.6;
  const trazo = grosor24;
  if (icon.startsWith("svg:")) {
    const url = icon.slice(4);
    if (esUrlDeVector(url)) return <VectorGlyph url={url} size={size} color={color} trazo={trazo} />;
    return <MaskGlyph url={url} size={size} color={color} />;
  }
  if (icon.startsWith("lucide:")) {
    const Icon = LAYER_ICONS[icon.slice(7)];
    return Icon ? <Icon width={size} height={size} color={color} strokeWidth={grosor24} /> : null;
  }
  const shape = SHAPES[icon.slice(6)];
  if (!shape) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={grosorPropio ? grosor24 * (100 / 24) : 5} strokeLinejoin="round">
      {shape}
    </svg>
  );
}
