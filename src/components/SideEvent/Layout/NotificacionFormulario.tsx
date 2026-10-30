"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./layout.module.css";

/*
  El formulario de un Flash llega como notificación al confirmar (handoff
  "Flash Layout" 3a): fija arriba, entra con rebote y "Llenar" late tres
  veces. "Llenar" abre el formulario en la hoja; la ✕ la cierra y el
  pendiente queda en la tarjeta del invitado ("Te falta el formulario").
*/

type Props = {
  titulo: string;
  iniciales: string;
  preguntas: number;
  color?: string;
  // Variables del estilo de bloques (helpers/estilosBloque.ts).
  vars?: React.CSSProperties;
  // Entra con retraso (después del confeti) o casi al momento (al volver).
  retrasoMs?: number;
  onLlenar: () => void;
  onCerrar: () => void;
};

// ~10 s por pregunta, redondeado a minutos (al menos 1).
const minutos = (n: number) => Math.max(1, Math.round((n * 10) / 60));

export default function NotificacionFormulario({ titulo, iniciales, preguntas, color, vars, retrasoMs = 900, onLlenar, onCerrar }: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className={styles.notif}
      role="status"
      style={{ "--blur-color": color ?? "#6E7FD8", ...vars, animationDelay: `${retrasoMs}ms` } as React.CSSProperties}
    >
      <span className={styles.notif_av} aria-hidden>{iniciales}</span>
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
      <button type="button" className={styles.notif_cerrar} onClick={onCerrar} aria-label="Cerrar aviso">
        <X size={13} strokeWidth={2.4} />
      </button>
    </div>,
    document.body,
  );
}
