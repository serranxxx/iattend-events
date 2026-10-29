"use client";

import React from "react";
import { profilesMap } from "@/components/ConfirmCard/profiles";
import { AvatarAsistente } from "./Asistentes";
import { EMOJIS_AVATAR, PERFILES_AVATAR, inicialesDe } from "./datosAsistentes";

import styles from "./selector-avatar.module.css";

/*
  Al confirmar un Flash con "Asistentes" prendido: cómo quiere aparecer el
  invitado: un emoji y un color. Llega con unos ya elegidos (al azar o los
  suyos) y los puede cambiar; nunca salen letras.
*/

export type AvatarElegido = { emoji: string | null; perfil: number | null };

export default function SelectorAvatar({
  nombre, valor, onChange, idBase = "nuevo",
}: { nombre: string; valor: AvatarElegido; onChange: (_valor: AvatarElegido) => void; idBase?: string }) {
  const muestra = { id: idBase, nombre, iniciales: inicialesDe(nombre), emoji: valor.emoji, perfil: valor.perfil };

  return (
    <div className={styles.selector}>
      <div className={styles.cabecera}>
        <AvatarAsistente a={muestra} size={48} />
        <div className={styles.textos}>
          <span className={styles.titulo}>¿Cómo quieres aparecer?</span>
          <span className={styles.hint}>Así te verán en la lista de asistentes. Es opcional.</span>
        </div>
      </div>

      <div className={styles.fila} role="radiogroup" aria-label="Emoji">
        {EMOJIS_AVATAR.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={valor.emoji === e}
            className={styles.opcion}
            data-on={valor.emoji === e || undefined}
            onClick={() => onChange({ ...valor, emoji: e })}
          >
            {e}
          </button>
        ))}
      </div>

      <div className={styles.colores} role="radiogroup" aria-label="Color">
        {PERFILES_AVATAR.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={valor.perfil === id}
            aria-label={`Color ${id}`}
            className={styles.color}
            data-on={valor.perfil === id || undefined}
            style={{ background: profilesMap[id].gradient }}
            onClick={() => onChange({ ...valor, perfil: id })}
          />
        ))}
      </div>
    </div>
  );
}
