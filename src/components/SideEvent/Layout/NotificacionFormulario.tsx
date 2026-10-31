"use client";

import React from "react";
import { createPortal } from "react-dom";
import { ClipboardList } from "lucide-react";
import styles from "./layout.module.css";

/*
  El formulario de un Flash llega como notificación al confirmar (handoff
  "Flash Layout" 3a): fija arriba, entra con rebote y "Llenar" late tres
  veces. "Llenar" abre el formulario en la hoja. No se puede cerrar: se
  queda mientras el formulario esté pendiente. Se ve como los widgets de la
  página (estilo de bloques; sin él, el vidrio teñido) y el cuadro lleva el
  ícono del formulario.
*/

type Props = {
  titulo: string;
  preguntas: number;
  color?: string;
  // Variables del estilo de bloques (helpers/estilosBloque.ts).
  vars?: React.CSSProperties;
  // Entra con retraso (después del confeti) o casi al momento (al volver).
  retrasoMs?: number;
  onLlenar: () => void;
};

// ~10 s por pregunta, redondeado a minutos (al menos 1).
const minutos = (n: number) => Math.max(1, Math.round((n * 10) / 60));

export default function NotificacionFormulario({ titulo, preguntas, color, vars, retrasoMs = 900, onLlenar }: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className={styles.notif}
      role="status"
      style={{ "--blur-color": color ?? "#6E7FD8", ...vars, animationDelay: `${retrasoMs}ms` } as React.CSSProperties}
    >
      <span className={styles.notif_av} aria-hidden><ClipboardList size={20} strokeWidth={2} /></span>
      <button type="button" className={styles.notif_textos} onClick={onLlenar}>
        <span className={styles.notif_titulo}>{titulo}</span>
        <span className={styles.notif_sub}>
          El organizador te pide {preguntas} {preguntas === 1 ? "dato" : "datos"} · {minutos(preguntas)} min
        </span>
      </button>
      <button
        type="button"
        className={styles.notif_llenar}
        style={{ animationDelay: `${retrasoMs + 700}ms` }}
        onClick={onLlenar}
      >
        Llenar
      </button>
    </div>,
    document.body,
  );
}
