"use client";

import React, { useId } from "react";
import type { PopSticker } from "@/types/side_event";

/*
  Dibujo a mano de un Pop (herramienta Dibujar del editor, handoff
  "Herramienta Dibujar (pincel)"): un elemento de la portada con
  `kind: "dibujo"`, pintado en SVG para que se vea nítido en cualquier
  pantalla. Mismo dibujo que el editor:
  iattend-vite/src/modules/Editor/Dibujo.jsx y dibujoData.js (si cambias uno,
  cambia el otro). Los puntos van en unidades de su caja (vbW × vbH); la
  opacidad es la del elemento (la pone SideEvent.tsx).
*/

type Pincel = { k: number; cap: "round" | "square" | "butt"; grano?: boolean; brillo?: boolean };
const PINCEL: Record<string, Pincel> = {
  pluma: { k: 1, cap: "round" },
  marcador: { k: 1.8, cap: "square" },
  resaltador: { k: 3, cap: "butt" },
  lapiz: { k: 0.55, cap: "round", grano: true },
  neon: { k: 1.3, cap: "round", brillo: true },
};

// Curvas cuadráticas por los puntos medios (el suavizado del pincel).
const pathDe = (pts?: [number, number][] | null) => {
  if (!pts?.length) return "";
  const f = (n: number) => Math.round(n * 10) / 10;
  if (pts.length === 1) return `M${f(pts[0][0])} ${f(pts[0][1])}l0.1 0`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)} ${f((pts[i][1] + pts[i + 1][1]) / 2)}`;
  }
  const l = pts[pts.length - 1];
  return `${d}L${f(l[0])} ${f(l[1])}`;
};

// Un color hacia el blanco (`t` 0–1): el tubo del neón.
const aclarar = (hex: string, t: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const c = (v: number) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

// Lápiz: 4 pasadas con un temblor fijo (±0.9 px) para dar grano.
const temblor = (pts: [number, number][], k: number): [number, number][] =>
  pts.map(([x, y], i) => [x + Math.sin(i * 1.7 + k * 2.1) * 0.9, y + Math.cos(i * 1.3 + k) * 0.9]);

export default function Dibujo({ s }: { s: PopSticker }) {
  const id = useId().replace(/:/g, "");
  const p = PINCEL[s.brush ?? "pluma"] ?? PINCEL.pluma;
  const vbW = s.vbW ?? 1;
  const vbH = s.vbH ?? 1;
  const size = s.size ?? 8;
  const color = s.color || "#FFFFFF";
  const ancho = size * p.k;
  const puntos = s.points ?? [];
  const d = pathDe(puntos);
  const comun = { fill: "none", strokeLinecap: p.cap, strokeLinejoin: "round" as const };
  const borrado = (s.erase ?? []).length > 0;

  // Neón: tubo casi blanco con la orilla del color y un halo amplio del color.
  const cuerpo = p.brillo ? (
    <>
      <path d={d} {...comun} stroke={color} strokeWidth={ancho * 2.2} opacity={0.85} filter={`url(#b${id})`} />
      <path d={d} {...comun} stroke={color} strokeWidth={ancho * 1.3} filter={`url(#c${id})`} />
      <path d={d} {...comun} stroke={aclarar(color, 0.45)} strokeWidth={ancho} />
      <path d={d} {...comun} stroke={aclarar(color, 0.9)} strokeWidth={ancho * 0.66} filter={`url(#n${id})`} />
    </>
  ) : p.grano ? (
    [0, 1, 2, 3].map((k) => <path key={k} d={pathDe(temblor(puntos, k))} {...comun} stroke={color} strokeWidth={ancho} opacity={0.45} />)
  ) : (
    <path d={d} {...comun} stroke={color} strokeWidth={ancho} />
  );

  return (
    <span style={{ display: "block", width: "100%", aspectRatio: `${vbW} / ${vbH}` }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" height="100%" overflow="visible" style={{ display: "block", overflow: "visible" }}>
        <defs>
          {p.brillo && (
            <>
              <filter id={`b${id}`} filterUnits="userSpaceOnUse" x={-vbW} y={-vbH} width={vbW * 3} height={vbH * 3}>
                <feGaussianBlur stdDeviation={ancho * 1.5} />
              </filter>
              <filter id={`c${id}`} filterUnits="userSpaceOnUse" x={-vbW} y={-vbH} width={vbW * 3} height={vbH * 3}>
                <feGaussianBlur stdDeviation={ancho * 0.45} />
              </filter>
              <filter id={`n${id}`} filterUnits="userSpaceOnUse" x={-vbW} y={-vbH} width={vbW * 3} height={vbH * 3}>
                <feGaussianBlur stdDeviation={ancho * 0.08} />
              </filter>
            </>
          )}
          {borrado && (
            <mask id={`m${id}`} maskUnits="userSpaceOnUse" x={-vbW} y={-vbH} width={vbW * 3} height={vbH * 3}>
              <rect x={-vbW} y={-vbH} width={vbW * 3} height={vbH * 3} fill="white" />
              {s.erase!.map((e, i) => (
                <path key={i} d={pathDe(e.points)} fill="none" stroke="black" strokeWidth={e.size} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </mask>
          )}
        </defs>
        <g mask={borrado ? `url(#m${id})` : undefined}>{cuerpo}</g>
      </svg>
    </span>
  );
}
