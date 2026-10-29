"use client";

import React from "react";
import { estiloVector, useVector, type VectorFields } from "@/helpers/vector";
import styles from "./vector.module.css";

// Vector (`vector: true`): SVG en línea con color y grosor propios. Mientras
// carga (y en el servidor) se ve como máscara, igual que un ícono.
export default function Vector({ s, color, className = "" }: { s: VectorFields & { src?: string; ar?: number | null }; color: string; className?: string }) {
  const info = useVector(s.src);
  if (!info) {
    return (
      <span
        className={`${styles.mask} ${className}`}
        style={{ backgroundColor: color, WebkitMaskImage: `url("${s.src}")`, maskImage: `url("${s.src}")`, aspectRatio: `1 / ${s.ar ?? 1}` }}
      />
    );
  }
  return (
    <span
      className={`${styles.vector} ${className}`}
      style={{ color, aspectRatio: `${info.vbW} / ${info.vbH}`, ...estiloVector(s, info) } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: info.markup }}
    />
  );
}
