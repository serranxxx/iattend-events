"use client";

import React from "react";
import { ChevronRight, Lock, MessageCircle } from "lucide-react";
import styles from "./chat-flash.module.css";

/*
  Fila "Chat de asistentes" al pie de la tarjeta Asistentes (handoff, vista
  A). Confirmado: vista previa del último mensaje y "n nuevos". Sin confirmar:
  el chat es solo para confirmados; tocarla lleva a los botones de confirmar.
*/

type Props = {
  bloqueada: boolean;
  noLeidos: number;
  ultimo?: { nombre: string; texto: string } | null;
  onOpen: () => void;
};

export default function FilaChat({ bloqueada, noLeidos, ultimo, onOpen }: Props) {
  return (
    <button type="button" className={styles.entry} onClick={onOpen}>
      <span className={styles.entry_icon}>{bloqueada ? <Lock size={16} /> : <MessageCircle size={18} />}</span>
      <span className={styles.entry_col}>
        <span className={styles.entry_title}>
          <span className={styles.entry_title_texto}>Chat de asistentes</span>
          {!bloqueada && noLeidos > 0 && <span className={styles.unread}>{noLeidos} nuevo{noLeidos === 1 ? "" : "s"}</span>}
        </span>
        {bloqueada ? (
          <span className={`${styles.entry_preview} ${styles.entry_lock}`}>Confirma tu asistencia para entrar</span>
        ) : ultimo ? (
          <span className={styles.entry_preview}><b>{ultimo.nombre}:</b> {ultimo.texto}</span>
        ) : (
          <span className={styles.entry_preview}>Saluda al grupo 👋</span>
        )}
      </span>
      <ChevronRight size={18} strokeWidth={2.2} />
    </button>
  );
}
