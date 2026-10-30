"use client";

import React, { useEffect, useMemo } from "react";
import styles from "./layout.module.css";

/*
  Confeti en explosión al confirmar (handoff "Flash Layout" 3a): 70 piezas
  salen de abajo al centro (donde está el botón Asistiré), suben abriéndose y
  caen. Capa sin eventos de puntero; se desmonta sola (~3.8 s). Con
  "reducir movimiento" no se pinta.
*/

const COLORES = ["#FFD25E", "#FFFFFF", "#B9A4F5", "#86C0EE", "#F59AC4", "#A0D97B"];
const al = (a: number, b: number) => a + Math.random() * (b - a);

export default function ConfetiExplosion({ onFin }: { onFin: () => void }) {
  const reducir = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const piezas = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const t = al(6, 12);
    return {
      i,
      x: al(-190, 190),
      y: al(-780, -320),
      rot: al(-540, 540),
      w: t,
      h: Math.random() < 0.3 ? t : t * al(0.4, 0.7),
      circulo: Math.random() < 0.3,
      color: COLORES[i % COLORES.length],
      dur: al(1.9, 3.0),
      retraso: al(0, 0.12),
    };
  }), []);

  useEffect(() => {
    const t = window.setTimeout(onFin, reducir ? 0 : 3800);
    return () => window.clearTimeout(t);
  }, [onFin, reducir]);

  if (reducir) return null;

  return (
    <div className={styles.confeti} aria-hidden>
      {piezas.map((p) => (
        <span
          key={p.i}
          className={styles.confeti_pieza}
          style={{
            "--x": `${p.x}px`,
            "--y": `${p.y}px`,
            "--rot": `${p.rot}deg`,
            width: p.w,
            height: p.circulo ? p.w : p.h,
            borderRadius: p.circulo ? "50%" : "2px",
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.retraso}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
